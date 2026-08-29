import { admin } from '@/lib/supabaseAdmin';
import { getEnrolledFaces } from '@/lib/enrolledFaces';
import {
  faceDistance,
  isFaceDescriptor,
} from '@/lib/faceDescriptor';


const DEFAULT_MATCH_DISTANCE = 0.55;
const MAX_MATCH_DISTANCE = 0.60;
const MAX_FRAME_DISTANCE = 0.65;

const MIN_MARGIN = 0.08;

const MIN_FRAMES = 3;

function getThreshold() {
  const configured = Number(
    process.env.FACE_MATCH_THRESHOLD ||
      process.env.NEXT_PUBLIC_FACE_MATCH_THRESHOLD
  );

  if (!Number.isFinite(configured)) {
    return DEFAULT_MATCH_DISTANCE;
  }

  return Math.min(Math.max(configured, 0.45), MAX_MATCH_DISTANCE);
}


function validDescriptors(value) {
  if (!Array.isArray(value)) {
    return false;
  }

  return (
    value.length >= MIN_FRAMES &&
    value.every((item) =>
      isFaceDescriptor(item)
    )
  );
}


function calculateTeacherMatch(
  descriptors,
  teacher
) {
  const distances = descriptors.map(
    (item) =>
      faceDistance(
        item,
        teacher.face_descriptor
      )
  );

  const average =
    distances.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / distances.length;

  const worst =
    Math.max(...distances);

  return {
    ...teacher,
    averageDistance: average,
    worstDistance: worst,
    distances,
  };
}

function findMatches(
  descriptors,
  teachers
) {
  return teachers
    .map((teacher) =>
      calculateTeacherMatch(
        descriptors,
        teacher
      )
    )
    .sort(
      (a, b) =>
        a.averageDistance -
        b.averageDistance
    );
}

export default async function handler(
  req,
  res
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  try {
    const body = req.body || {};

    
    let descriptors =
      body.faceDescriptors;

    if (
      !Array.isArray(descriptors) &&
      body.faceDescriptor
    ) {
      descriptors = [
        body.faceDescriptor,
      ];
    }

    if (
      !validDescriptors(descriptors)
    ) {
      return res.status(400).json({
        error:
          'Please keep one clear face in the camera and try again.',
      });
    }

    const db = admin();

    

    let enrolledTeachers =
      await getEnrolledFaces();

    if (!enrolledTeachers.length) {
      return res.status(401).json({
        error:
          'No enrolled teacher faces are available yet.',
      });
    }

   
    let matches = findMatches(
      descriptors,
      enrolledTeachers
    );

    let best = matches[0];
    let second = matches[1];

    
    if (!best) {
      enrolledTeachers =
        await getEnrolledFaces(true);

      matches = findMatches(
        descriptors,
        enrolledTeachers
      );

      best = matches[0];
      second = matches[1];
    }

    if (!best) {
      return res.status(401).json({
        error:
          'Face not recognized.',
      });
    }

    const threshold =
      getThreshold();

   
    if (
      best.averageDistance >
        threshold ||
      best.worstDistance >
        MAX_FRAME_DISTANCE
    ) {
      console.warn(
        'FACE REJECTED - distance',
        {
          teacher:
            best.full_name,
          average:
            best.averageDistance,
          worst:
            best.worstDistance,
          threshold,
        }
      );

      return res.status(401).json({
        error:
          'Face not recognized. Please look directly at the camera and try again.',
      });
    }

    

    if (second) {
      const margin =
        second.averageDistance -
        best.averageDistance;

      if (
        margin < MIN_MARGIN
      ) {
        console.warn(
          'FACE REJECTED - ambiguous',
          {
            bestTeacher:
              best.full_name,

            bestDistance:
              best.averageDistance,

            secondTeacher:
              second.full_name,

            secondDistance:
              second.averageDistance,

            margin,
          }
        );

        return res.status(401).json({
          error:
            'Face match is not clear. Please look directly at the camera and try again.',
        });
      }
    }

   

    const timezone =
      process.env.SCHOOL_TIMEZONE ||
      'Asia/Kolkata';

    const attendanceDate =
      new Intl.DateTimeFormat(
        'en-CA',
        {
          timeZone: timezone,
        }
      ).format(new Date());

    const now =
      new Date().toISOString();

    

    const existing =
      await db
        .from('attendance')
        .select(
          `
          id,
          teacher_id,
          attendance_date,
          in_time,
          out_time,
          status,
          verification_method,
          updated_at
          `
        )
        .eq(
          'teacher_id',
          best.id
        )
        .eq(
          'attendance_date',
          attendanceDate
        )
        .order(
          'in_time',
          {
            ascending: false,
          }
        );

    if (existing.error) {
      throw existing.error;
    }

    const records =
      existing.data || [];

    const latest =
      records.length
        ? records[0]
        : null;

    let action;
    let result;

    /*
     * --------------------------------
     * FIRST IN
     * --------------------------------
     */

    if (!latest) {
      action = 'in';

      result =
        await db
          .from('attendance')
          .insert({
            teacher_id:
              best.id,

            attendance_date:
              attendanceDate,

            in_time: now,

            out_time: null,

            status: 'present',

            verification_method:
              'face',
          })
          .select()
          .single();
    }

    /*
     * --------------------------------
     * OUT
     * --------------------------------
     */

    else if (
      latest.in_time &&
      !latest.out_time
    ) {
      action = 'out';

      result =
        await db
          .from('attendance')
          .update({
            out_time: now,
            updated_at: now,
          })
          .eq(
            'id',
            latest.id
          )
          .select()
          .single();
    }

    /*
     * --------------------------------
     * NEXT IN
     * --------------------------------
     *
     * Previous session already has OUT.
     */

    else {
      action = 'in';

      result =
        await db
          .from('attendance')
          .insert({
            teacher_id:
              best.id,

            attendance_date:
              attendanceDate,

            in_time: now,

            out_time: null,

            status: 'present',

            verification_method:
              'face',
          })
          .select()
          .single();
    }

    /*
     * --------------------------------
     * DATABASE ERROR
     * --------------------------------
     */

    if (result.error) {
      console.error(
        'Attendance database error:',
        result.error
      );

      if (
        result.error.code ===
        '23505'
      ) {
        return res.status(409).json({
          error:
            'Database still has a unique attendance-per-day constraint. Run the SQL below to remove it.',
        });
      }

      throw result.error;
    }

    /*
     * --------------------------------
     * SUCCESS
     * --------------------------------
     */

    return res.status(200).json({
      teacher:
        best.full_name,

      action,

      attendance:
        result.data,

      faceDistance:
        Number(
          best.averageDistance.toFixed(
            4
          )
        ),
    });
  } catch (error) {
    console.error(
      'Face verification error:',
      error
    );

    return res.status(400).json({
      error:
        error.message ||
        'Unable to verify attendance.',
    });
  }
}
