import { admin } from '@/lib/supabaseAdmin';
import { isFaceDescriptor } from '@/lib/faceDescriptor';

const timezone =
  process.env.SCHOOL_TIMEZONE || 'Asia/Kolkata';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  try {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
    }).format(new Date());

    const db = admin();

    const [
      teachersResult,
      attendanceResult,
    ] = await Promise.all([
      db
        .from('teachers')
        .select(
          'id,full_name,monthly_salary,status,face_enrolled,face_descriptor'
        )
        .order('full_name', {
          ascending: true,
        }),

      db
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
        .eq('attendance_date', today)
        .order('in_time', {
          ascending: true,
        }),
    ]);

    if (teachersResult.error) {
      throw teachersResult.error;
    }

    if (attendanceResult.error) {
      throw attendanceResult.error;
    }

    /*
     * Group attendance rows by teacher.
     *
     * Example:
     *
     * Teacher A:
     * [
     *   {
     *     in_time: 09:00,
     *     out_time: 13:00
     *   },
     *   {
     *     in_time: 14:00,
     *     out_time: 18:00
     *   }
     * ]
     */
    const attendanceByTeacher = new Map();

    for (const record of attendanceResult.data || []) {
      if (!attendanceByTeacher.has(record.teacher_id)) {
        attendanceByTeacher.set(
          record.teacher_id,
          []
        );
      }

      attendanceByTeacher
        .get(record.teacher_id)
        .push(record);
    }

    const teachers = (
      teachersResult.data || []
    ).map(
      ({
        face_descriptor,
        ...teacher
      }) => {
        const attendance =
          attendanceByTeacher.get(
            teacher.id
          ) || [];

        /*
         * The last attendance record tells us
         * whether the teacher is currently IN.
         *
         * If last record has no out_time:
         * teacher is currently inside.
         */
        const lastRecord =
          attendance.length > 0
            ? attendance[
                attendance.length - 1
              ]
            : null;

        const currentlyIn =
          Boolean(
            lastRecord?.in_time &&
              !lastRecord?.out_time
          );

        return {
          ...teacher,

          face_enrolled:
            isFaceDescriptor(
              face_descriptor
            ),

          attendance,

          currentlyIn,

          /*
           * Number of completed sessions.
           *
           * 09:00 → 13:00 = 1
           * 14:00 → 18:00 = 2
           */
          completedSessions:
            attendance.filter(
              (item) =>
                item.in_time &&
                item.out_time
            ).length,
        };
      }
    );

    return res.status(200).json({
      date: today,
      teachers,
    });
  } catch (error) {
    console.error(
      'Today attendance API error:',
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        'Unable to load attendance.',
    });
  }
}