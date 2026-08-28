// import { useCallback, useEffect, useState } from 'react';
// import FaceCamera from '@/components/FaceCamera';

// const IST = 'Asia/Kolkata';
// const time = (value) => new Date(value).toLocaleTimeString('en-IN', { timeZone: IST, hour: '2-digit', minute: '2-digit' });

// export default function AttendanceKiosk() {
//   const [result, setResult] = useState(null);
//   const [activity, setActivity] = useState([]);

//   const loadActivity = useCallback(async () => {
//     try {
//       const response = await fetch('/api/attendance/today');
//       const data = await response.json();
//       if (!response.ok) throw new Error(data.error);
//       setActivity(data.teachers.filter((teacher) => teacher.attendance).sort((first, second) => new Date(second.attendance.updated_at) - new Date(first.attendance.updated_at)).slice(0, 8));
//     } catch {
//       setActivity([]);
//     }
//   }, []);

//   useEffect(() => {
//     const initialLoad = window.setTimeout(loadActivity, 0);
//     return () => window.clearTimeout(initialLoad);
//   }, [loadActivity]);

//   const verify = useCallback(async (faceDescriptor) => {
//     const response = await fetch('/api/face/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ faceDescriptor }) });
//     const data = await response.json();
//     if (!response.ok) throw new Error(data.error);
//     setResult(data);
//     await loadActivity();
//   }, [loadActivity]);

//   return <main className="mx-auto min-h-screen max-w-5xl p-4 sm:p-8"><div className="mb-6 text-center"><div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-700 font-bold text-white">TA</div><h1 className="m-0 text-2xl font-bold">Teacher Attendance</h1><p className="text-slate-500">Today — {new Date().toLocaleDateString('en-IN', { timeZone: IST, day: '2-digit', month: 'long', year: 'numeric' })}</p></div><section className="card p-4 sm:p-6"><h2 className="mt-0 text-lg">Face Verification</h2><FaceCamera onCapture={verify}/>{result && <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-emerald-900"><b>Attendance marked successfully</b><p className="mb-0 mt-1 text-sm">{result.teacher} · {result.action === 'in' ? 'IN' : 'OUT'} at {time(result.action === 'in' ? result.attendance.in_time : result.attendance.out_time)}</p></div>}</section><section className="card mt-5 p-5"><h2 className="mt-0 text-lg">Today’s Activity</h2>{activity.length ? activity.map((teacher) => { const record = teacher.attendance; return <div key={teacher.id} className="flex justify-between border-t py-3 text-sm"><b>{teacher.full_name}</b><span>{record.out_time ? 'OUT' : 'IN'} {time(record.out_time || record.in_time)}</span></div>; }) : <p className="text-sm text-slate-500">No attendance activity yet.</p>}</section></main>;
// }










import { useCallback, useEffect, useState } from 'react';
import FaceCamera from '@/components/FaceCamera';

const IST = 'Asia/Kolkata';

function formatTime(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleTimeString('en-IN', {
    timeZone: IST,
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AttendanceKiosk() {
  const [result, setResult] = useState(null);
  const [activity, setActivity] = useState([]);

  const loadActivity = useCallback(async () => {
    try {
      const response = await fetch('/api/attendance/today');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load activity.');
      }

      const teachers = data.teachers || [];

      /*
       * attendance is now an ARRAY.
       *
       * Example:
       * [
       *   09:00 IN → 13:00 OUT,
       *   14:00 IN → 18:00 OUT
       * ]
       */

      const activityRows = [];

      teachers.forEach((teacher) => {
        const attendance = Array.isArray(teacher.attendance)
          ? teacher.attendance
          : teacher.attendance
            ? [teacher.attendance]
            : [];

        attendance.forEach((record) => {
          activityRows.push({
            teacherId: teacher.id,
            teacherName: teacher.full_name,
            record,
          });
        });
      });

      /*
       * Show newest attendance activity first.
       */
      activityRows.sort((a, b) => {
        const aTime = new Date(
          a.record.out_time ||
            a.record.in_time ||
            a.record.updated_at
        ).getTime();

        const bTime = new Date(
          b.record.out_time ||
            b.record.in_time ||
            b.record.updated_at
        ).getTime();

        return bTime - aTime;
      });

      setActivity(activityRows.slice(0, 8));
    } catch (error) {
      console.error('Activity load error:', error);
      setActivity([]);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(
      loadActivity,
      0
    );

    return () => {
      window.clearTimeout(initialLoad);
    };
  }, [loadActivity]);

  const verify = useCallback(
    async (faceDescriptors) => {
      try {
        const response = await fetch(
          '/api/face/verify',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ faceDescriptors }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Unable to verify attendance.'
          );
        }

        setResult(data);

        await loadActivity();
      } catch (error) {
        console.error('Face verification error:', error);

        setResult({
          error:
            error.message ||
            'Unable to verify attendance.',
        });

        // FaceCamera must receive the rejection so it does not show a
        // successful "Face Recognized" state for a failed API match.
        throw error;
      }
    },
    [loadActivity]
  );

  const today = new Date().toLocaleDateString(
    'en-IN',
    {
      timeZone: IST,
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }
  );

  return (
    <main className="mx-auto min-h-screen max-w-5xl p-4 sm:p-8">

      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-700 font-bold text-white">
          TA
        </div>

        <h1 className="m-0 text-2xl font-bold">
          Teacher Attendance
        </h1>

        <p className="text-slate-500">
          Today — {today}
        </p>
      </div>

      {/* Face Verification */}
      <section className="card p-4 sm:p-6">
        <h2 className="mt-0 text-lg">
          Face Verification
        </h2>

        <FaceCamera onCapture={verify} />

        {result && (
          <div
            className={`mt-4 rounded-xl p-4 ${
              result.error
                ? 'bg-red-50 text-red-900'
                : 'bg-emerald-50 text-emerald-900'
            }`}
          >
            {result.error ? (
              <>
                <b>Attendance not marked</b>

                <p className="mb-0 mt-1 text-sm">
                  {result.error}
                </p>
              </>
            ) : (
              <>
                <b>
                  Attendance marked successfully
                </b>

                <p className="mb-0 mt-1 text-sm">
                  {result.teacher} ·{' '}
                  {result.action === 'in'
                    ? 'IN'
                    : 'OUT'}{' '}
                  at{' '}
                  {formatTime(
                    result.action === 'in'
                      ? result.attendance?.in_time
                      : result.attendance?.out_time
                  )}
                </p>
              </>
            )}
          </div>
        )}
      </section>

      {/* Today's Activity */}
      <section className="card mt-5 p-5">
        <h2 className="mt-0 text-lg">
          Today’s Activity
        </h2>

        {activity.length > 0 ? (
          activity.map((item) => {
            const record = item.record;

            const isOut = Boolean(
              record.out_time
            );

            const displayTime = isOut
              ? record.out_time
              : record.in_time;

            return (
              <div
                key={`${item.teacherId}-${record.id}`}
                className="flex justify-between border-t py-3 text-sm"
              >
                <b>{item.teacherName}</b>

                <span>
                  {isOut ? 'OUT' : 'IN'}{' '}
                  {formatTime(displayTime)}
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-500">
            No attendance activity yet.
          </p>
        )}
      </section>
    </main>
  );
}
