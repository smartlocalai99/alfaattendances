// import { admin } from '@/lib/supabaseAdmin';
// import { getEnrolledFaces } from '@/lib/enrolledFaces';
// import { faceDistance, isFaceDescriptor } from '@/lib/faceDescriptor';

// const defaultMatchThreshold = 0.58;

// function matchThreshold() {
//   const configured = Number(process.env.FACE_MATCH_THRESHOLD || process.env.NEXT_PUBLIC_FACE_MATCH_THRESHOLD);
//   // 0.48 is too strict for descriptors captured from different mobile-camera frames.
//   return Number.isFinite(configured) ? Math.max(configured, defaultMatchThreshold) : defaultMatchThreshold;
// }

// function closestMatch(faceDescriptor, enrolledTeachers) {
//   return enrolledTeachers.reduce((match, teacher) => {
//     const value = faceDistance(faceDescriptor, teacher.face_descriptor);
//     return !match || value < match.distance ? { ...teacher, distance: value } : match;
//   }, null);
// }

// export default async function handler(req, res) {
//   if (req.method !== 'POST') return res.status(405).end();
//   try {
//     const { faceDescriptor } = req.body;
//     if (!isFaceDescriptor(faceDescriptor)) throw new Error('Invalid face data.');
//     const db = admin();
//     let enrolledTeachers = await getEnrolledFaces();
//     let match = closestMatch(faceDescriptor, enrolledTeachers);

//     // A newly enrolled face may not be in another server process's short-lived cache.
//     if (!match || match.distance > matchThreshold()) {
//       enrolledTeachers = await getEnrolledFaces(true);
//       match = closestMatch(faceDescriptor, enrolledTeachers);
//     }
//     if (!enrolledTeachers.length) {
//       return res.status(401).json({ error: 'No enrolled teacher faces are available yet.' });
//     }
//     if (!match || match.distance > matchThreshold()) {
//       return res.status(401).json({ error: 'Face not recognized. Use a clear, front-facing view or update the enrolled face.' });
//     }

//     const attendanceDate = new Intl.DateTimeFormat('en-CA', { timeZone: process.env.SCHOOL_TIMEZONE || 'Asia/Kolkata' }).format(new Date());
//     const found = await db.from('attendance').select('*').eq('teacher_id', match.id).eq('attendance_date', attendanceDate).maybeSingle();
//     if (found.error) throw found.error;
//     let action;
//     let result;
//     if (!found.data) {
//       action = 'in';
//       result = await db.from('attendance').insert({ teacher_id: match.id, attendance_date: attendanceDate, in_time: new Date().toISOString(), status: 'present', verification_method: 'face' }).select().single();
//     } else if (!found.data.in_time) {
//       return res.status(409).json({ error: 'Please mark IN before marking OUT.' });
//     } else if (!found.data.out_time) {
//       action = 'out';
//       result = await db.from('attendance').update({ out_time: new Date().toISOString() }).eq('id', found.data.id).select().single();
//     } else {
//       return res.status(409).json({ error: 'OUT is already marked for today.' });
//     }
//     if (result.error) throw result.error;
//     return res.json({ teacher: match.full_name, action, attendance: result.data });
//   } catch (error) {
//     return res.status(400).json({ error: error.message || 'Unable to verify attendance.' });
//   }
// }




import { admin } from '@/lib/supabaseAdmin';
import { getEnrolledFaces } from '@/lib/enrolledFaces';
import {
  faceDistance,
  isFaceDescriptor,
} from '@/lib/faceDescriptor';

/*
 * IMPORTANT:
 *
 * Lower number = stricter face matching.
 *
 * 0.58 was allowing false matches.
 * 0.48 is much safer for attendance.
 */
const DEFAULT_MATCH_THRESHOLD = 0.48;

/*
 * Minimum distance difference between the best
 * and second-best teacher.
 *
 * This prevents:
 *
 * Chinni = 0.46
 * Another = 0.47
 *
 * from being accepted because the two faces
 * are too similar/ambiguous.
 */
const MIN_MATCH_MARGIN = 0.06;

function getMatchThreshold() {
  const configured = Number(
    process.env.FACE_MATCH_THRESHOLD ||
      process.env.NEXT_PUBLIC_FACE_MATCH_THRESHOLD
  );

  if (!Number.isFinite(configured)) {
    return DEFAULT_MATCH_THRESHOLD;
  }

  /*
   * Never allow environment settings to make
   * matching less strict than 0.48.
   */
  return Math.min(
    configured,
    DEFAULT_MATCH_THRESHOLD
  );
}

function findBestMatches(
  faceDescriptor,
  enrolledTeachers
) {
  return enrolledTeachers
    .map((teacher) => {
      const distance = faceDistance(
        faceDescriptor,
        teacher.face_descriptor
      );

      return {
        ...teacher,
        distance,
      };
    })
    .sort(
      (a, b) =>
        a.distance - b.distance
    );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  try {
    const { faceDescriptor } =
      req.body || {};

    /*
     * Validate incoming face descriptor.
     */
    if (!isFaceDescriptor(faceDescriptor)) {
      return res.status(400).json({
        error: 'Invalid face data.',
      });
    }

    const db = admin();

    /*
     * -----------------------------------------
     * LOAD ENROLLED TEACHERS
     * -----------------------------------------
     */

    let enrolledTeachers =
      await getEnrolledFaces();

    if (!enrolledTeachers.length) {
      return res.status(401).json({
        error:
          'No enrolled teacher faces are available yet.',
      });
    }

    /*
     * -----------------------------------------
     * FIND BEST FACE MATCH
     * -----------------------------------------
     */

    let matches = findBestMatches(
      faceDescriptor,
      enrolledTeachers
    );

    let bestMatch = matches[0];
    let secondMatch = matches[1];

    /*
     * Refresh face cache once.
     *
     * Useful immediately after enrolling
     * a new teacher.
     */
    if (
      !bestMatch ||
      bestMatch.distance >
        getMatchThreshold()
    ) {
      enrolledTeachers =
        await getEnrolledFaces(true);

      matches = findBestMatches(
        faceDescriptor,
        enrolledTeachers
      );

      bestMatch = matches[0];
      secondMatch = matches[1];
    }

    /*
     * -----------------------------------------
     * STRICT FACE CHECK
     * -----------------------------------------
     */

    if (!bestMatch) {
      return res.status(401).json({
        error:
          'Face not recognized.',
      });
    }

    const threshold =
      getMatchThreshold();

    /*
     * Check absolute distance.
     */
    if (
      bestMatch.distance > threshold
    ) {
      console.warn(
        'Face rejected - distance too high:',
        {
          teacher:
            bestMatch.full_name,
          distance:
            bestMatch.distance,
          threshold,
        }
      );

      return res.status(401).json({
        error:
          'Face not recognized. Please look directly at the camera and try again.',
      });
    }

    /*
     * Check ambiguity.
     *
     * If another teacher's face is almost
     * equally close, reject the match.
     */
    if (secondMatch) {
      const margin =
        secondMatch.distance -
        bestMatch.distance;

      if (margin < MIN_MATCH_MARGIN) {
        console.warn(
          'Face rejected - ambiguous match:',
          {
            bestTeacher:
              bestMatch.full_name,
            bestDistance:
              bestMatch.distance,
            secondTeacher:
              secondMatch.full_name,
            secondDistance:
              secondMatch.distance,
            margin,
          }
        );

        return res.status(401).json({
          error:
            'Face match is not clear. Please face the camera directly and try again.',
        });
      }
    }

    /*
     * -----------------------------------------
     * TODAY'S DATE
     * -----------------------------------------
     */

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

    /*
     * -----------------------------------------
     * LOAD ALL ATTENDANCE SESSIONS TODAY
     * -----------------------------------------
     */

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
          bestMatch.id
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

    /*
     * Latest session.
     */
    const latestRecord =
      records.length
        ? records[0]
        : null;

    let action;
    let result;

    /*
     * -----------------------------------------
     * FIRST IN
     * -----------------------------------------
     */

    if (!latestRecord) {
      action = 'in';

      result = await db
        .from('attendance')
        .insert({
          teacher_id:
            bestMatch.id,

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
     * -----------------------------------------
     * OUT
     * -----------------------------------------
     */

    else if (
      latestRecord.in_time &&
      !latestRecord.out_time
    ) {
      action = 'out';

      result = await db
        .from('attendance')
        .update({
          out_time: now,
          updated_at: now,
        })
        .eq(
          'id',
          latestRecord.id
        )
        .select()
        .single();
    }

    /*
     * -----------------------------------------
     * NEXT IN
     * -----------------------------------------
     *
     * Previous session already has OUT.
     *
     * Example:
     *
     * 09:00 IN
     * 13:00 OUT
     *
     * Next scan:
     *
     * 14:00 IN
     */

    else {
      action = 'in';

      result = await db
        .from('attendance')
        .insert({
          teacher_id:
            bestMatch.id,

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
     * -----------------------------------------
     * DATABASE ERROR
     * -----------------------------------------
     */

    if (result.error) {
      console.error(
        'Attendance database error:',
        result.error
      );

      /*
       * If the unique constraint still exists,
       * give a clear message.
       */
      if (
        result.error.code ===
        '23505'
      ) {
        return res.status(409).json({
          error:
            'Attendance database still has a unique-per-day constraint. Remove the unique_teacher_attendance_per_day or unique_teacher_attendance_date constraint in Supabase.',
        });
      }

      throw result.error;
    }

    /*
     * -----------------------------------------
     * SUCCESS
     * -----------------------------------------
     */

    return res.status(200).json({
      teacher:
        bestMatch.full_name,

      action,

      attendance:
        result.data,

      faceDistance:
        Number(
          bestMatch.distance.toFixed(
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