// import { useEffect, useState } from 'react';
// import Link from 'next/link';
// import {
//   ArrowLeft,
//   Download,
//   Eye,
//   X,
// } from 'lucide-react';
// import Layout from '@/components/Layout';
// import { calculatePayroll } from '@/lib/payroll';

// export default function Payroll() {
//   const [teachers, setTeachers] = useState([]);
//   const [month, setMonth] = useState(
//     new Date().getMonth() + 1
//   );
//   const [year, setYear] = useState(
//     new Date().getFullYear()
//   );

//   const [report, setReport] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [previewOpen, setPreviewOpen] = useState(false);

//   function getDateRange() {
//     const start = `${year}-${String(month).padStart(
//       2,
//       '0'
//     )}-01`;

//     const end = new Date(
//       year,
//       month,
//       0
//     )
//       .toISOString()
//       .slice(0, 10);

//     return { start, end };
//   }

//   /* Load Teachers */
//   useEffect(() => {
//     async function loadTeachers() {
//       try {
//         const response = await fetch('/api/teachers');
//         const data = await response.json();

//         if (!response.ok) {
//           throw new Error(
//             data.error || 'Unable to load teachers.'
//           );
//         }

//         setTeachers(
//           (data.teachers || []).filter(
//             (teacher) => teacher.status === 'active'
//           )
//         );
//       } catch (error) {
//         console.error(error);
//         setTeachers([]);
//       }
//     }

//     loadTeachers();
//   }, []);

//   /* Automatically Generate Payroll */
//   useEffect(() => {
//     if (!teachers.length) return;

//     async function loadPayroll() {
//       setLoading(true);

//       try {
//         const { start, end } = getDateRange();

//         let complaintsData = [];

//         try {
//           const complaintResponse = await fetch(
//             `/api/complaints?start=${start}&end=${end}`
//           );

//           if (complaintResponse.ok) {
//             const complaintJson =
//               await complaintResponse.json();

//             complaintsData =
//               complaintJson.complaints || [];
//           }
//         } catch (error) {
//           console.log('Complaints unavailable');
//         }

//         const results = await Promise.all(
//           teachers.map(async (teacher) => {
//             try {
//               const response = await fetch(
//                 `/api/attendance?teacherId=${encodeURIComponent(
//                   teacher.id
//                 )}&start=${start}&end=${end}`
//               );

//               const data = await response.json();

//               const attendance =
//                 data.attendance || [];

//               const present = attendance.filter(
//                 (item) => item.status === 'present'
//               ).length;

//               const leaves = attendance.filter(
//                 (item) =>
//                   item.status === 'absent' ||
//                   item.status === 'unpaid_leave' ||
//                   item.status === 'leave'
//               ).length;

//               const complaintCount =
//                 complaintsData.filter(
//                   (complaint) =>
//                     complaint.teacher_id === teacher.id ||
//                     complaint.teacherId === teacher.id
//                 ).length;

//               const baseSalary = Number(
//                 teacher.monthly_salary || 0
//               );

//               const payroll = calculatePayroll({
//                 monthlySalary: baseSalary,
//                 workingDays: 26,
//                 presentDays: present,
//                 halfDays: 0,
//                 paidLeaveDays: 0,
//                 unpaidLeaveDays: leaves,
//               });

//               return {
//                 id: teacher.id,
//                 name:
//                   teacher.full_name ||
//                   'Unnamed Teacher',
//                 baseSalary,
//                 present,
//                 leaves,
//                 complaints: complaintCount,
//                 netPay: payroll.netPay || 0,
//               };
//             } catch (error) {
//               console.error(error);

//               return {
//                 id: teacher.id,
//                 name:
//                   teacher.full_name ||
//                   'Unnamed Teacher',
//                 baseSalary: Number(
//                   teacher.monthly_salary || 0
//                 ),
//                 present: 0,
//                 leaves: 0,
//                 complaints: 0,
//                 netPay: Number(
//                   teacher.monthly_salary || 0
//                 ),
//               };
//             }
//           })
//         );

//         setReport(results);
//       } catch (error) {
//         console.error(error);
//         setReport([]);
//       } finally {
//         setLoading(false);
//       }
//     }

//     loadPayroll();
//   }, [teachers, month, year]);

//   function downloadReport() {
//     if (!report.length) {
//       alert('No payroll report available.');
//       return;
//     }

//     const header =
//       'Teacher Name,Base Salary,Present,Leaves,Complaints,Net Pay';

//     const rows = report.map((item) => {
//       const name = `"${String(
//         item.name
//       ).replace(/"/g, '""')}"`;

//       return [
//         name,
//         item.baseSalary,
//         item.present,
//         item.leaves,
//         item.complaints,
//         item.netPay,
//       ].join(',');
//     });

//     const csv = [header, ...rows].join('\n');

//     const blob = new Blob([csv], {
//       type: 'text/csv;charset=utf-8;',
//     });

//     const url = URL.createObjectURL(blob);

//     const link = document.createElement('a');

//     link.href = url;

//     link.download = `Payroll_${year}_${String(
//       month
//     ).padStart(2, '0')}.csv`;

//     document.body.appendChild(link);

//     link.click();

//     document.body.removeChild(link);

//     URL.revokeObjectURL(url);
//   }

//   const monthName = new Date(
//     year,
//     month - 1
//   ).toLocaleString('en-IN', {
//     month: 'long',
//   });

//   return (
//     <Layout
//       title={
//         <div className="flex items-center gap-1">
//           <Link
//             href="/dashboard"
//             aria-label="Back"
//             className="flex h-7 w-7 items-center justify-center text-slate-800"
//           >
//             <ArrowLeft size={20} />
//           </Link>

//           <span>Payroll</span>
//         </div>
//       }
//     >
//       <section className="card mx-auto max-w-4xl p-4 sm:p-6">
//         <h2 className="m-0 text-xl font-bold text-slate-800">
//           Monthly Payroll
//         </h2>

//         <p className="mt-1 text-sm text-slate-500">
//           Teacher salary report based on attendance.
//         </p>

//         {/* Filters */}

//         <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
//           <select
//             className="field"
//             value={month}
//             onChange={(e) =>
//               setMonth(Number(e.target.value))
//             }
//           >
//             {Array.from(
//               { length: 12 },
//               (_, index) => (
//                 <option
//                   key={index + 1}
//                   value={index + 1}
//                 >
//                   {new Date(
//                     2000,
//                     index
//                   ).toLocaleString('en', {
//                     month: 'long',
//                   })}
//                 </option>
//               )
//             )}
//           </select>

//           <input
//             className="field"
//             type="number"
//             value={year}
//             onChange={(e) =>
//               setYear(Number(e.target.value))
//             }
//           />
//         </div>

//         {/* Buttons */}

//         <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
//           <button
//             type="button"
//             className="btn-primary flex items-center justify-center gap-2"
//             disabled={loading || !report.length}
//             onClick={() => setPreviewOpen(true)}
//           >
//             <Eye size={18} />

//             {loading
//               ? 'Loading...'
//               : 'Preview Report'}
//           </button>

//           <button
//             type="button"
//             className="btn-secondary flex items-center justify-center gap-2"
//             disabled={loading || !report.length}
//             onClick={downloadReport}
//           >
//             <Download size={18} />

//             Download Report
//           </button>
//         </div>

//         {/* Summary */}

//         {!loading && report.length > 0 && (
//           <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

            

            
//           </div>
//         )}
//       </section>

//       {/* Preview Modal */}

//       {previewOpen && (
//         <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center">
//           <div className="h-[85vh] w-full overflow-hidden rounded-t-3xl bg-white sm:h-auto sm:max-h-[85vh] sm:max-w-4xl sm:rounded-2xl">
//             {/* Modal Header */}

//             <div className="flex items-center justify-between border-b border-slate-200 p-4">
//               <div>
//                 <h3 className="text-lg font-bold text-slate-800">
//                   Payroll Report
//                 </h3>

//                 <p className="text-xs text-slate-500">
//                   {monthName} {year}
//                 </p>
//               </div>

//               <button
//                 onClick={() =>
//                   setPreviewOpen(false)
//                 }
//                 className="rounded-full p-2 hover:bg-slate-100"
//               >
//                 <X size={22} />
//               </button>
//             </div>

//             {/* Table */}

//             <div className="h-full overflow-auto p-3 sm:p-5">
//               <div className="min-w-[700px]">
//                 <div className="grid grid-cols-[1.6fr_1fr_.7fr_.7fr_.8fr_1fr] border-b bg-slate-50 px-3 py-3 text-xs font-bold uppercase text-slate-500">
//                   <div>Teacher Name</div>
//                   <div>Base Salary</div>
//                   <div>Present</div>
//                   <div>Leaves</div>
//                   <div>Complaints</div>
//                   <div>Net Pay</div>
//                 </div>

//                 {report.map((item) => (
//                   <div
//                     key={item.id}
//                     className="grid grid-cols-[1.6fr_1fr_.7fr_.7fr_.8fr_1fr] border-b border-slate-100 px-3 py-3 text-sm"
//                   >
//                     <div className="font-semibold text-slate-800">
//                       {item.name}
//                     </div>

//                     <div>
//                       ₹
//                       {item.baseSalary.toLocaleString(
//                         'en-IN'
//                       )}
//                     </div>

//                     <div>{item.present}</div>

//                     <div>{item.leaves}</div>

//                     <div>{item.complaints}</div>

//                     <div className="font-bold text-emerald-700">
//                       ₹
//                       {item.netPay.toLocaleString(
//                         'en-IN'
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Footer */}

//             <div className="border-t border-slate-200 p-4">
//               <button
//                 className="btn-primary flex w-full items-center justify-center gap-2"
//                 onClick={downloadReport}
//               >
//                 <Download size={18} />

//                 Download Report
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </Layout>
//   );
// }









import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Eye,
  X,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { calculatePayroll } from '@/lib/payroll';

export default function Payroll() {
  const [teachers, setTeachers] = useState([]);
  const [month, setMonth] = useState(
    new Date().getMonth() + 1
  );
  const [year, setYear] = useState(
    new Date().getFullYear()
  );

  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  function getDateRange() {
    const start = `${year}-${String(month).padStart(
      2,
      '0'
    )}-01`;

    const end = new Date(year, month, 0)
      .toISOString()
      .slice(0, 10);

    return { start, end };
  }

  /* Load Active Teachers */
  useEffect(() => {
    async function loadTeachers() {
      try {
        const response = await fetch('/api/teachers');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || 'Unable to load teachers.'
          );
        }

        setTeachers(
          (data.teachers || []).filter(
            (teacher) => teacher.status === 'active'
          )
        );
      } catch (error) {
        console.error(error);
        setTeachers([]);
      }
    }

    loadTeachers();
  }, []);

  /* Generate Payroll */
  useEffect(() => {
    if (!teachers.length) return;

    async function loadPayroll() {
      setLoading(true);

      try {
        const { start, end } = getDateRange();

        /*
         * Get complaints from DB.
         *
         * Your complaints API returns:
         * id
         * teacher_name
         * complaint
         * created_at
         */
        let complaintsData = [];

        try {
          const complaintResponse = await fetch(
            `/api/complaints?start=${start}&end=${end}`
          );

          if (complaintResponse.ok) {
            const complaintJson =
              await complaintResponse.json();

            complaintsData =
              complaintJson.complaints || [];
          }
        } catch (error) {
          console.error(
            'Unable to load complaints:',
            error
          );
        }

        const results = await Promise.all(
          teachers.map(async (teacher) => {
            try {
              /* Get Attendance */
              const response = await fetch(
                `/api/attendance?teacherId=${encodeURIComponent(
                  teacher.id
                )}&start=${start}&end=${end}`
              );

              const data = await response.json();

              const attendance =
                data.attendance || [];

              const present = attendance.filter(
                (item) =>
                  item.status === 'present'
              ).length;

              const leaves = attendance.filter(
                (item) =>
                  item.status === 'absent' ||
                  item.status === 'unpaid_leave' ||
                  item.status === 'leave'
              ).length;

              /*
               * Get complaints for this teacher
               * using teacher_name because your DB
               * does not have teacher_id.
               */
              const teacherComplaints =
                complaintsData.filter(
                  (item) =>
                    String(
                      item.teacher_name || ''
                    )
                      .trim()
                      .toLowerCase() ===
                    String(
                      teacher.full_name || ''
                    )
                      .trim()
                      .toLowerCase()
                );

              /*
               * Get the actual complaint text
               * from the complaints table.
               */
              const complaintText =
                teacherComplaints
                  .map(
                    (item) =>
                      String(
                        item.complaint || ''
                      ).trim()
                  )
                  .filter(Boolean)
                  .join('; ');

              const baseSalary = Number(
                teacher.monthly_salary || 0
              );

              const payroll = calculatePayroll({
                monthlySalary: baseSalary,
                workingDays: 26,
                presentDays: present,
                halfDays: 0,
                paidLeaveDays: 0,
                unpaidLeaveDays: leaves,
              });

              return {
                id: teacher.id,

                name:
                  teacher.full_name ||
                  'Unnamed Teacher',

                baseSalary,

                present,

                leaves,

                /*
                 * Actual complaint text from DB
                 */
                complaints:
                  complaintText || 'No complaints',

                netPay: payroll.netPay || 0,
              };
            } catch (error) {
              console.error(error);

              return {
                id: teacher.id,

                name:
                  teacher.full_name ||
                  'Unnamed Teacher',

                baseSalary: Number(
                  teacher.monthly_salary || 0
                ),

                present: 0,

                leaves: 0,

                complaints: 'No complaints',

                netPay: Number(
                  teacher.monthly_salary || 0
                ),
              };
            }
          })
        );

        setReport(results);
      } catch (error) {
        console.error(error);
        setReport([]);
      } finally {
        setLoading(false);
      }
    }

    loadPayroll();
  }, [teachers, month, year]);

  /* Download CSV */
  function downloadReport() {
    if (!report.length) {
      alert('No payroll report available.');
      return;
    }

    const header =
      'Teacher Name,Base Salary,Present,Leaves,Complaints,Net Pay';

    const rows = report.map((item) => {
      const name = `"${String(
        item.name
      ).replace(/"/g, '""')}"`;

      const complaints = `"${String(
        item.complaints || ''
      ).replace(/"/g, '""')}"`;

      return [
        name,
        item.baseSalary,
        item.present,
        item.leaves,
        complaints,
        item.netPay,
      ].join(',');
    });

    const csv = [header, ...rows].join('\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;

    link.download = `Payroll_${year}_${String(
      month
    ).padStart(2, '0')}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  const monthName = new Date(
    year,
    month - 1
  ).toLocaleString('en-IN', {
    month: 'long',
  });

  return (
    <Layout
      title={
        <div className="flex items-center gap-1">
          <Link
            href="/dashboard"
            aria-label="Back"
            className="flex h-7 w-7 items-center justify-center text-slate-800"
          >
            <ArrowLeft size={20} />
          </Link>

          <span>Payroll</span>
        </div>
      }
    >
      <section className="card mx-auto max-w-4xl p-4 sm:p-6">
        <h2 className="m-0 text-xl font-bold text-slate-800">
          Monthly Payroll
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Teacher salary report based on attendance.
        </p>

        {/* Filters */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            className="field"
            value={month}
            onChange={(e) =>
              setMonth(Number(e.target.value))
            }
          >
            {Array.from(
              { length: 12 },
              (_, index) => (
                <option
                  key={index + 1}
                  value={index + 1}
                >
                  {new Date(
                    2000,
                    index
                  ).toLocaleString('en', {
                    month: 'long',
                  })}
                </option>
              )
            )}
          </select>

          <input
            className="field"
            type="number"
            value={year}
            onChange={(e) =>
              setYear(Number(e.target.value))
            }
          />
        </div>

        {/* Buttons */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="btn-primary flex items-center justify-center gap-2"
            disabled={loading || !report.length}
            onClick={() => setPreviewOpen(true)}
          >
            <Eye size={18} />

            {loading
              ? 'Loading...'
              : 'Preview Report'}
          </button>

          <button
            type="button"
            className="btn-secondary flex items-center justify-center gap-2"
            disabled={loading || !report.length}
            onClick={downloadReport}
          >
            <Download size={18} />

            Download Report
          </button>
        </div>
      </section>

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center">
          <div className="h-[85vh] w-full overflow-hidden rounded-t-3xl bg-white sm:h-auto sm:max-h-[85vh] sm:max-w-5xl sm:rounded-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Payroll Report
                </h3>

                <p className="text-xs text-slate-500">
                  {monthName} {year}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPreviewOpen(false)
                }
                className="rounded-full p-2 hover:bg-slate-100"
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </div>

            {/* Table */}
            <div className="h-full overflow-auto p-3 sm:p-5">
              <div className="min-w-[850px]">

                {/* Table Header */}
                <div className="grid grid-cols-[1.5fr_1fr_.7fr_.7fr_2fr_1fr] border-b bg-slate-50 px-3 py-3 text-xs font-bold uppercase text-slate-500">
                  <div>Teacher Name</div>
                  <div>Base Salary</div>
                  <div>Present</div>
                  <div>Leaves</div>
                  <div>Complaints</div>
                  <div>Net Pay</div>
                </div>

                {/* Table Rows */}
                {report.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1.5fr_1fr_.7fr_.7fr_2fr_1fr] border-b border-slate-100 px-3 py-3 text-sm"
                  >
                    <div className="font-semibold text-slate-800">
                      {item.name}
                    </div>

                    <div>
                      ₹
                      {item.baseSalary.toLocaleString(
                        'en-IN'
                      )}
                    </div>

                    <div>
                      {item.present}
                    </div>

                    <div>
                      {item.leaves}
                    </div>

                    {/* Actual Complaint */}
                    <div className="break-words whitespace-normal text-slate-700">
                      {item.complaints}
                    </div>

                    <div className="font-bold text-emerald-700">
                      ₹
                      {item.netPay.toLocaleString(
                        'en-IN'
                      )}
                    </div>
                  </div>
                ))}

              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 p-4">
              <button
                type="button"
                className="btn-primary flex w-full items-center justify-center gap-2"
                onClick={downloadReport}
              >
                <Download size={18} />

                Download Report
              </button>
            </div>

          </div>
        </div>
      )}
    </Layout>
  );
}

