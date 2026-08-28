// import { useEffect, useState } from 'react';
// import Link from 'next/link';
// import { ArrowLeft } from 'lucide-react';
// import Layout from '@/components/Layout';
// import { durationBetween } from '@/lib/payroll';

// const IST = 'Asia/Kolkata';

// const time = (value) =>
//   value
//     ? new Date(value).toLocaleTimeString('en-IN', {
//         timeZone: IST,
//         hour: '2-digit',
//         minute: '2-digit',
//       })
//     : '—';

// export default function AttendanceTiming() {
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     async function load() {
//       try {
//         const response = await fetch('/api/attendance/today');
//         const data = await response.json();

//         if (!response.ok) {
//           throw new Error(
//             data.error || 'Unable to load attendance.'
//           );
//         }

//         setRows(
//           (data.teachers || []).filter(
//             (teacher) => teacher.status === 'active'
//           )
//         );
//       } catch (error) {
//         console.error(error);
//         setRows([]);
//       } finally {
//         setLoading(false);
//       }
//     }

//     load();
//   }, []);

//   return (
//     <Layout
//       title={
//         <div className="flex items-center gap-1">
//           <Link
//             href="/dashboard"
//             aria-label="Back to Dashboard"
//             className="flex h-7 w-7 shrink-0 items-center justify-center text-slate-800"
//           >
//             <ArrowLeft size={18} />
//           </Link>

//           <span>IN / OUT</span>
//         </div>
//       }
//     >
//       <div className="card w-full min-w-0 max-w-full overflow-hidden p-3 sm:p-4">

//         {/* Header */}
//         <div className="mb-3">
//           <h2 className="m-0 text-sm font-bold text-slate-800">
//             Today’s Attendance
//           </h2>

//           <p className="mb-0 mt-1 text-[9px] text-slate-500">
//             Timing records are marked by face verification.
//           </p>
//         </div>

//         {/* Attendance */}
//         <div className="w-full min-w-0">

//           {/* Header Row */}
//           <div
//             className="
//               grid
//               w-full
//               grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)]
//               border-b
//               border-slate-200
//             "
//           >
//             <div className="min-w-0 py-2 pr-1 text-left text-[8px] font-semibold uppercase text-slate-500">
//               NAME
//             </div>

//             <div className="min-w-0 py-2 px-1 text-left text-[8px] font-semibold uppercase text-slate-500">
//               IN / OUT
//             </div>

//             <div className="min-w-0 py-2 pl-1 text-left text-[8px] font-semibold uppercase text-slate-500">
//               WORK HR
//             </div>
//           </div>

//           {/* Loading */}
//           {loading && (
//             <div className="py-4 text-center text-xs text-slate-500">
//               Loading attendance...
//             </div>
//           )}

//           {/* Rows */}
//           {!loading && rows.length > 0 && (
//             <div className="w-full">
//               {rows.map((teacher) => {
//                 const record = teacher.attendance;

//                 return (
//                   <div
//                     key={teacher.id}
//                     className="
//                       grid
//                       w-full
//                       grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)]
//                       border-b
//                       border-slate-100
//                     "
//                   >
//                     {/* NAME */}
//                     <div className="min-w-0 overflow-hidden py-2 pr-1 text-left text-[8px] font-semibold text-slate-800">
//                       <span className="block truncate">
//                         {teacher.full_name || 'Unnamed teacher'}
//                       </span>
//                     </div>

//                     {/* IN / OUT */}
//                     <div className="min-w-0 overflow-hidden py-2 px-1 text-left text-[8px] whitespace-nowrap text-slate-700">
//                       {time(record?.in_time)} / {time(record?.out_time)}
//                     </div>

//                     {/* WORK HR */}
//                     <div className="min-w-0 overflow-hidden py-2 pl-1 text-left text-[8px] font-semibold whitespace-nowrap text-slate-700">
//                       {record?.in_time
//                         ? durationBetween(
//                             record.in_time,
//                             record.out_time
//                           )
//                         : '—'}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}

//           {/* No Data */}
//           {!loading && rows.length === 0 && (
//             <div className="py-4 text-center text-xs text-slate-500">
//               No active teachers found.
//             </div>
//           )}

//         </div>
//       </div>
//     </Layout>
//   );
// }
















import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';

/* Timezone */
const IST = 'Asia/Kolkata';

/* Format time */
const time = (value) =>
  value
    ? new Date(value).toLocaleTimeString('en-IN', {
        timeZone: IST,
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

/*
 * Calculate ONLY completed IN / OUT sessions.
 *
 * If a teacher is currently IN and has no OUT:
 *
 * 11:03 AM / —
 *
 * Work HR will remain:
 *
 * —
 *
 * The current unfinished session is NOT counted.
 */
function totalDuration(records) {
  if (!records || records.length === 0) {
    return '—';
  }

  let totalMilliseconds = 0;

  records.forEach((record) => {
    // Do not calculate an unfinished session
    if (!record.in_time || !record.out_time) {
      return;
    }

    const start = new Date(record.in_time);
    const end = new Date(record.out_time);

    const difference =
      end.getTime() - start.getTime();

    if (difference > 0) {
      totalMilliseconds += difference;
    }
  });

  // No completed session yet
  if (totalMilliseconds <= 0) {
    return '—';
  }

  const totalMinutes = Math.floor(
    totalMilliseconds / (1000 * 60)
  );

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

export default function AttendanceTiming() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const response = await fetch(
          '/api/attendance/today'
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Unable to load attendance.'
          );
        }

        setRows(
          (data.teachers || []).filter(
            (teacher) =>
              teacher.status === 'active'
          )
        );
      } catch (error) {
        console.error(error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <Layout
      title={
        <div className="flex items-center gap-1">
          <Link
            href="/dashboard"
            aria-label="Back to Dashboard"
            className="flex h-7 w-7 shrink-0 items-center justify-center text-slate-800"
          >
            <ArrowLeft size={18} />
          </Link>

          <span>IN / OUT</span>
        </div>
      }
    >
      <div className="card w-full min-w-0 max-w-full overflow-hidden p-3 sm:p-4">

        {/* Header */}
        <div className="mb-3">
          <h2 className="m-0 text-sm font-bold text-slate-800">
            Today’s Attendance
          </h2>

          <p className="mb-0 mt-1 text-[9px] text-slate-500">
            Timing records are marked by face verification.
          </p>
        </div>

        {/* Attendance */}
        <div className="w-full min-w-0">

          {/* Header Row */}
          <div
            className="
              grid
              w-full
              grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)]
              border-b
              border-slate-200
            "
          >
            <div className="min-w-0 py-2 pr-1 text-left text-[8px] font-semibold uppercase text-slate-500">
              NAME
            </div>

            <div className="min-w-0 py-2 px-1 text-left text-[8px] font-semibold uppercase text-slate-500">
              IN / OUT
            </div>

            <div className="min-w-0 py-2 pl-1 text-left text-[8px] font-semibold uppercase text-slate-500">
              WORK HR
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="py-4 text-center text-xs text-slate-500">
              Loading attendance...
            </div>
          )}

          {/* Rows */}
          {!loading && rows.length > 0 && (
            <div className="w-full">
              {rows.map((teacher) => {

                /*
                 * API returns:
                 *
                 * attendance: [
                 *   {
                 *     in_time: "...",
                 *     out_time: "..."
                 *   },
                 *   {
                 *     in_time: "...",
                 *     out_time: "..."
                 *   }
                 * ]
                 *
                 * For compatibility, if the API
                 * somehow returns one object, convert
                 * it into an array.
                 */
                const records = Array.isArray(
                  teacher.attendance
                )
                  ? teacher.attendance
                  : teacher.attendance
                    ? [teacher.attendance]
                    : [];

                return (
                  <div
                    key={teacher.id}
                    className="
                      grid
                      w-full
                      grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)]
                      border-b
                      border-slate-100
                    "
                  >

                    {/* NAME */}
                    <div className="min-w-0 overflow-hidden py-2 pr-1 text-left text-[8px] font-semibold text-slate-800">
                      <span className="block truncate">
                        {teacher.full_name ||
                          'Unnamed teacher'}
                      </span>
                    </div>

                    {/* IN / OUT */}
                    <div className="min-w-0 overflow-hidden py-2 px-1 text-left text-[8px] text-slate-700">
                      {records.length > 0 ? (
                        <div className="space-y-1">
                          {records.map(
                            (record, index) => (
                              <div
                                key={
                                  record.id ||
                                  index
                                }
                                className="whitespace-nowrap"
                              >
                                {time(
                                  record.in_time
                                )}{' '}
                                /{' '}
                                {time(
                                  record.out_time
                                )}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </div>

                    {/* WORK HR */}
                    <div className="min-w-0 overflow-hidden py-2 pl-1 text-left text-[8px] font-semibold text-slate-700">
                      {totalDuration(records)}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* No Data */}
          {!loading &&
            rows.length === 0 && (
              <div className="py-4 text-center text-xs text-slate-500">
                No active teachers found.
              </div>
            )}

        </div>
      </div>
    </Layout>
  );
}