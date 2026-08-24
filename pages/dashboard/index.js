// import { useEffect, useState } from 'react';
// import Link from 'next/link';
// import { useRouter } from 'next/router';
// import Layout from '@/components/Layout';
// import StatCard from '@/components/StatCard';
// import FaceEnrollmentModal from '@/components/FaceEnrollmentModal';
// import MonthlyAttendanceReport from '@/components/MonthlyAttendanceReport';
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

// export default function Dashboard() {
//   const router = useRouter();

//   const [teachers, setTeachers] = useState([]);
//   const [search, setSearch] = useState('');
//   const [loadError, setLoadError] = useState('');
//   const [selectedTeacher, setSelectedTeacher] = useState(null);

//   async function load() {
//     try {
//       setLoadError('');

//       const response = await fetch('/api/attendance/today');
//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error);
//       }

//       setTeachers(data.teachers || []);
//     } catch {
//       setLoadError(
//         'Unable to load teachers from Supabase. Please refresh and try again.'
//       );
//     }
//   }

//   useEffect(() => {
//     load();

//     window.addEventListener('focus', load);

//     return () => {
//       window.removeEventListener('focus', load);
//     };
//   }, []);

//   const rows = teachers.filter((teacher) =>
//     teacher.full_name
//       .toLowerCase()
//       .includes(search.toLowerCase())
//   );

//   // Active teachers
//   const activeStaff = teachers.filter(
//     (teacher) => teacher.status === 'active'
//   ).length;

//   // Teacher checked IN but not OUT
//   const present = teachers.filter(
//     (teacher) =>
//       teacher.attendance?.in_time &&
//       !teacher.attendance?.out_time
//   ).length;

//   // Active teacher has no attendance marked today
//   const absent = teachers.filter(
//     (teacher) =>
//       teacher.status === 'active' &&
//       !teacher.attendance
//   ).length;

//   // Teacher has both IN and OUT
//   const completed = teachers.filter(
//     (teacher) =>
//       teacher.attendance?.in_time &&
//       teacher.attendance?.out_time
//   ).length;

//   return (
//     <Layout
//       title="Teacher Attendance"
//       action={
//         <Link
//           href="/dashboard/teachers/new"
//           className="btn-primary"
//         >
//           + Add Teacher
//         </Link>
//       }
//     >
//       {/* SUCCESS MESSAGE */}
//       {router.query.added === '1' && (
//         <p className="mb-5 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
//           Teacher saved successfully. Enroll their face whenever
//           you are ready.
//         </p>
//       )}

//       {/* ERROR MESSAGE */}
//       {loadError && (
//         <p className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
//           {loadError}
//         </p>
//       )}

//       {/* TODAY */}
//       <div className="mb-4">
//         <h2 className="text-lg font-bold text-slate-800">
//           Today
//         </h2>

//         <p className="text-xs text-slate-500">
//           {new Date().toLocaleDateString('en-IN', {
//             day: '2-digit',
//             month: 'short',
//             year: 'numeric',
//           })}
//         </p>
//       </div>

//       {/* STAT CARDS */}
//       <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
//         <StatCard
//           type="active"
//           label="Active staff"
//           value={activeStaff}
//           description="Registered"
//         />

//         <StatCard
//           type="present"
//           label="Present"
//           value={present}
//           description={`${present} still on site`}
//         />

//         <StatCard
//           type="absent"
//           label="Absent"
//           value={absent}
//           description="No check-in"
//           footer="today"
//         />

//         <StatCard
//           type="completed"
//           label="Completed"
//           value={completed}
//           description="Checked out"
//         />
//       </div>

//       {/* MONTHLY ATTENDANCE REPORT */}
//       <MonthlyAttendanceReport />

//       {/* LIST OF TEACHERS */}
//       <section className="card mt-7 p-0">
//         <div className="flex flex-wrap items-center justify-between gap-3 p-5">
//           <h2 className="m-0 text-lg font-bold">
//             List of Teachers
//           </h2>

//           <input
//             className="field max-w-xs"
//             placeholder="Search teachers…"
//             value={search}
//             onChange={(event) =>
//               setSearch(event.target.value)
//             }
//           />
//         </div>

//         <div className="table-wrap">
//           <table>
//             <thead>
//               <tr>
//                 <th>Teacher</th>
//                 <th>Subject</th>
//                 <th> IN</th>
//                 <th> OUT</th>
//                 <th>Working Hours</th>
//                 <th>Status</th>
//                 <th>Face</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>

//             <tbody>
//               {rows.length > 0 ? (
//                 rows.map((teacher) => {
//                   const record = teacher.attendance;

//                   const status = !record
//                     ? 'Not Marked'
//                     : record.out_time
//                     ? 'Present'
//                     : 'Currently IN';

//                   return (
//                     <tr key={teacher.id}>
//                       {/* TEACHER */}
//                       <td>
//                         <b>{teacher.full_name}</b>
//                       </td>

//                       {/* SUBJECT */}
//                       <td>
//                         {teacher.subject || '—'}
//                       </td>

//                       {/* TODAY'S IN */}
//                       <td>
//                         {time(record?.in_time)}
//                       </td>

//                       {/* TODAY'S OUT */}
//                       <td>
//                         {time(record?.out_time)}
//                       </td>

//                       {/* WORKING HOURS */}
//                       <td>
//                         {durationBetween(
//                           record?.in_time,
//                           record?.out_time
//                         )}
//                       </td>

//                       {/* STATUS */}
//                       <td>
//                         <span
//                           className={
//                             record?.out_time
//                               ? 'text-emerald-700'
//                               : record?.in_time
//                               ? 'text-amber-700'
//                               : 'text-slate-500'
//                           }
//                         >
//                           {status}
//                         </span>
//                       </td>

//                       {/* FACE */}
//                       <td>
//                         <span
//                           className={
//                             teacher.face_enrolled
//                               ? 'text-emerald-700'
//                               : 'text-slate-500'
//                           }
//                         >
//                           {teacher.face_enrolled
//                             ? 'Enrolled'
//                             : 'Not enrolled'}
//                         </span>
//                       </td>

//                       {/* ACTIONS */}
//                       <td>
//                         <button
//                           type="button"
//                           className="btn-secondary whitespace-nowrap"
//                           onClick={() =>
//                             setSelectedTeacher(teacher)
//                           }
//                         >
//                           {teacher.face_enrolled
//                             ? 'Update Face'
//                             : 'Enroll Face'}
//                         </button>
//                       </td>
//                     </tr>
//                   );
//                 })
//               ) : (
//                 <tr>
//                   <td
//                     colSpan={8}
//                     className="py-8 text-center text-slate-500"
//                   >
//                     No teachers found.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </section>

//       {/* FACE ENROLLMENT MODAL */}
//       {selectedTeacher && (
//         <FaceEnrollmentModal
//           teacherId={selectedTeacher.id}
//           teacherName={selectedTeacher.full_name}
//           onComplete={() => {
//             setSelectedTeacher(null);
//             load();
//           }}
//         />
//       )}
//     </Layout>
//   );
// }








import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import FaceEnrollmentModal from '@/components/FaceEnrollmentModal';
import MonthlyAttendanceReport from '@/components/MonthlyAttendanceReport';
import { durationBetween } from '@/lib/payroll';

const IST = 'Asia/Kolkata';

const time = (value) =>
  value
    ? new Date(value).toLocaleTimeString('en-IN', {
        timeZone: IST,
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export default function Dashboard() {
  const router = useRouter();

  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  async function load() {
    try {
      setLoadError('');

      const response = await fetch('/api/attendance/today');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setTeachers(data.teachers || []);
    } catch {
      setLoadError(
        'Unable to load teachers from Supabase. Please refresh and try again.'
      );
    }
  }

  useEffect(() => {
    load();

    window.addEventListener('focus', load);

    return () => {
      window.removeEventListener('focus', load);
    };
  }, []);

  const rows = teachers.filter((teacher) =>
    teacher.full_name
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Active teachers
  const activeStaff = teachers.filter(
    (teacher) => teacher.status === 'active'
  ).length;

  // Teacher checked IN but not OUT
  const present = teachers.filter(
    (teacher) =>
      teacher.attendance?.in_time &&
      !teacher.attendance?.out_time
  ).length;

  // Active teacher has no attendance marked today
  const absent = teachers.filter(
    (teacher) =>
      teacher.status === 'active' &&
      !teacher.attendance
  ).length;

  // Teacher has both IN and OUT
  const completed = teachers.filter(
    (teacher) =>
      teacher.attendance?.in_time &&
      teacher.attendance?.out_time
  ).length;

  return (
    <Layout
      title="Teacher Attendance"
      action={
        <Link
          href="/dashboard/teachers/new"
          className="btn-primary"
        >
          + Add Teacher
        </Link>
      }
    >
      {/* SUCCESS MESSAGE */}
      {router.query.added === '1' && (
        <p className="mb-5 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
          Teacher saved successfully. Enroll their face whenever
          you are ready.
        </p>
      )}

      {/* ERROR MESSAGE */}
      {loadError && (
        <p className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {loadError}
        </p>
      )}

      {/* TODAY */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-800">
          Today
        </h2>

        <p className="text-xs text-slate-500">
          {new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          type="active"
          label="Active staff"
          value={activeStaff}
          description="Registered"
        />

        <StatCard
          type="present"
          label="Present"
          value={present}
          description={`${present} still on site`}
        />

        <StatCard
          type="absent"
          label="Absent"
          value={absent}
          description="No check-in"
          footer="today"
        />

        <StatCard
          type="completed"
          label="Completed"
          value={completed}
          description="Checked out"
        />
      </div>

      {/* MONTHLY ATTENDANCE REPORT */}
      <MonthlyAttendanceReport />

      {/* LIST OF TEACHERS */}
      <section className="card mt-7 p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <h2 className="m-0 text-lg font-bold">
            List of Teachers
          </h2>

          <input
            className="field max-w-xs"
            placeholder="Search teachers…"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Subject</th>
                <th>IN</th>
                <th>OUT</th>
                <th>Working Hours</th>
                <th>Status</th>
                <th>Face</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.length > 0 ? (
                rows.map((teacher) => {
                  const record = teacher.attendance;

                  const status = !record
                    ? 'Not Marked'
                    : record.out_time
                    ? 'Present'
                    : 'Currently IN';

                  return (
                    <tr key={teacher.id}>
                      {/* TEACHER */}
                      <td>
                        <b>{teacher.full_name}</b>
                      </td>

                      {/* SUBJECT */}
                      <td>
                        {teacher.subject || '—'}
                      </td>

                      {/* IN */}
                      <td>
                        {time(record?.in_time)}
                      </td>

                      {/* OUT */}
                      <td>
                        {time(record?.out_time)}
                      </td>

                      {/* WORKING HOURS */}
                      <td>
                        {durationBetween(
                          record?.in_time,
                          record?.out_time
                        )}
                      </td>

                      {/* STATUS */}
                      <td>
                        <span
                          className={
                            record?.out_time
                              ? 'text-emerald-700'
                              : record?.in_time
                              ? 'text-amber-700'
                              : 'text-slate-500'
                          }
                        >
                          {status}
                        </span>
                      </td>

                      {/* FACE */}
                      <td>
                        <span
                          className={
                            teacher.face_enrolled
                              ? 'text-emerald-700'
                              : 'text-slate-500'
                          }
                        >
                          {teacher.face_enrolled
                            ? 'Enrolled'
                            : 'Not enrolled'}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td>
                        <button
                          type="button"
                          className={
                            teacher.face_enrolled
                              ? 'btn-secondary whitespace-nowrap'
                              : 'btn-primary whitespace-nowrap bg-emerald-600 hover:bg-emerald-700'
                          }
                          onClick={() =>
                            setSelectedTeacher(teacher)
                          }
                        >
                          {teacher.face_enrolled
                            ? 'Update Face'
                            : 'Enroll Face'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="py-8 text-center text-slate-500"
                  >
                    No teachers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* FACE ENROLLMENT MODAL */}
      {selectedTeacher && (
        <FaceEnrollmentModal
          key={selectedTeacher.id}
          teacherId={selectedTeacher.id}
          teacherName={selectedTeacher.full_name}
          onSaved={(enrolledTeacher) => {
            setTeachers((currentTeachers) => currentTeachers.map((teacher) =>
              teacher.id === enrolledTeacher.id
                ? { ...teacher, face_enrolled: enrolledTeacher.face_enrolled }
                : teacher
            ));
          }}
          onComplete={() => {
            setSelectedTeacher(null);
            load();
          }}
        />
      )}
    </Layout>
  );
}
