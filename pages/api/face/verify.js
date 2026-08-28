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

const defaultMatchThreshold = 0.58;

function matchThreshold() {
  const configured = Number(
    process.env.FACE_MATCH_THRESHOLD ||
      process.env.NEXT_PUBLIC_FACE_MATCH_THRESHOLD
  );

  return Number.isFinite(configured)
    ? Math.max(configured, defaultMatchThreshold)
    : defaultMatchThreshold;
}

function closestMatch(
  faceDescriptor,
  enrolledTeachers
) {
  return enrolledTeachers.reduce(
    (match, teacher) => {
      const value = faceDistance(
        faceDescriptor,
        teacher.face_descriptor
      );

      return !match || value < match.distance
        ? {
            ...teacher,
            distance: value,
          }
        : match;
    },
    null
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  try {
    const { faceDescriptor } = req.body || {};

    if (!isFaceDescriptor(faceDescriptor)) {
      throw new Error('Invalid face data.');
    }

    const db = admin();

    /* --------------------------------
       FIND TEACHER
    -------------------------------- */

    let enrolledTeachers =
      await getEnrolledFaces();

    let match = closestMatch(
      faceDescriptor,
      enrolledTeachers
    );

    /* Refresh cache if necessary */
    if (
      !match ||
      match.distance > matchThreshold()
    ) {
      enrolledTeachers =
        await getEnrolledFaces(true);

      match = closestMatch(
        faceDescriptor,
        enrolledTeachers
      );
    }

    if (!enrolledTeachers.length) {
      return res.status(401).json({
        error:
          'No enrolled teacher faces are available yet.',
      });
    }

    if (
      !match ||
      match.distance > matchThreshold()
    ) {
      return res.status(401).json({
        error:
          'Face not recognized. Use a clear, front-facing view or update the enrolled face.',
      });
    }

    /* --------------------------------
       TODAY
    -------------------------------- */

    const timezone =
      process.env.SCHOOL_TIMEZONE ||
      'Asia/Kolkata';

    const attendanceDate =
      new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
      }).format(new Date());

    const now = new Date().toISOString();

    /* --------------------------------
       GET ALL TODAY'S SESSIONS
    -------------------------------- */

    const existing = await db
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
      .eq('teacher_id', match.id)
      .eq('attendance_date', attendanceDate)
      .order('in_time', {
        ascending: false,
      });

    if (existing.error) {
      throw existing.error;
    }

    const records = existing.data || [];

    /*
     * IMPORTANT
     *
     * Find the latest session.
     *
     * Example:
     *
     * Session 1
     * 09:00 IN
     * 13:00 OUT
     *
     * Session 2
     * 14:00 IN
     * 18:00 OUT
     *
     * If the latest session has OUT:
     * create a NEW IN session.
     *
     * If the latest session has no OUT:
     * mark OUT on that session.
     */

    const latestRecord =
      records.length > 0
        ? records[0]
        : null;

    let action;
    let result;

    /* --------------------------------
       FIRST IN
    -------------------------------- */

    if (!latestRecord) {
      action = 'in';

      result = await db
        .from('attendance')
        .insert({
          teacher_id: match.id,
          attendance_date: attendanceDate,
          in_time: now,
          out_time: null,
          status: 'present',
          verification_method: 'face',
        })
        .select()
        .single();
    }

    /* --------------------------------
       OUT
    -------------------------------- */

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
        .eq('id', latestRecord.id)
        .select()
        .single();
    }

    /* --------------------------------
       SECOND / NEXT IN
    -------------------------------- */

    else {
      action = 'in';

      result = await db
        .from('attendance')
        .insert({
          teacher_id: match.id,
          attendance_date: attendanceDate,
          in_time: now,
          out_time: null,
          status: 'present',
          verification_method: 'face',
        })
        .select()
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    return res.status(200).json({
      teacher: match.full_name,
      action,
      attendance: result.data,
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