// import { useEffect, useState } from 'react';
// import Link from 'next/link';
// import { ArrowLeft, Download } from 'lucide-react';
// import Layout from '@/components/Layout';
// import { calculatePayroll, money } from '@/lib/payroll';

// export default function Payroll() {
//   const [teachers, setTeachers] = useState([]);
//   const [month, setMonth] = useState(new Date().getMonth() + 1);
//   const [year, setYear] = useState(new Date().getFullYear());

//   const [report, setReport] = useState([]);
//   const [loading, setLoading] = useState(false);

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

//         setTeachers(data.teachers || []);
//       } catch (error) {
//         console.error(error);
//         setTeachers([]);
//       }
//     }

//     loadTeachers();
//   }, []);

//   function getDateRange() {
//     const start = `${year}-${String(month).padStart(2, '0')}-01`;

//     const end = new Date(year, Number(month), 0)
//       .toISOString()
//       .slice(0, 10);

//     return { start, end };
//   }

//   async function calculate() {
//     if (!teachers.length) {
//       alert('No teachers found.');
//       return;
//     }

//     setLoading(true);
//     setReport([]);

//     try {
//       const { start, end } = getDateRange();

//       const results = await Promise.all(
//         teachers.map(async (teacher) => {
//           try {
//             const response = await fetch(
//               `/api/attendance?teacherId=${encodeURIComponent(
//                 teacher.id
//               )}&start=${start}&end=${end}`
//             );

//             const data = await response.json();

//             if (!response.ok) {
//               throw new Error(
//                 data.error || 'Unable to load attendance.'
//               );
//             }

//             const attendance = data.attendance || [];

//             const present = attendance.filter(
//               (entry) => entry.status === 'present'
//             ).length;

//             const absent = attendance.filter(
//               (entry) =>
//                 entry.status === 'absent' ||
//                 entry.status === 'unpaid_leave'
//             ).length;

//             const payroll = calculatePayroll({
//               monthlySalary: teacher.monthly_salary || 0,
//               workingDays: 26,
//               presentDays: present,
//               halfDays: 0,
//               paidLeaveDays: 0,
//               unpaidLeaveDays: absent,
//             });

//             return {
//               id: teacher.id,
//               name:
//                 teacher.full_name || 'Unnamed teacher',
//               present,
//               absent,
//               salary: payroll.netPay || 0,
//             };
//           } catch (error) {
//             console.error(error);

//             return {
//               id: teacher.id,
//               name:
//                 teacher.full_name || 'Unnamed teacher',
//               present: 0,
//               absent: 0,
//               salary: Number(
//                 teacher.monthly_salary || 0
//               ),
//             };
//           }
//         })
//       );

//       setReport(results);
//     } catch (error) {
//       console.error(error);
//       alert('Unable to calculate payroll.');
//     } finally {
//       setLoading(false);
//     }
//   }

//   /* -------------------------------------------------------
//      DOWNLOAD REPORT AS CSV
//   ------------------------------------------------------- */
//   function downloadReport() {
//     if (!report || report.length === 0) {
//       alert('Please calculate payroll first.');
//       return;
//     }

//     try {
//       // Only the required columns
//       const header =
//         'Teacher Name,Present,Absent,Salary';

//       const rows = report.map((teacher) => {
//         const name = `"${String(
//           teacher.name
//         ).replace(/"/g, '""')}"`;

//         return [
//           name,
//           teacher.present,
//           teacher.absent,
//           teacher.salary,
//         ].join(',');
//       });

//       const csv = [header, ...rows].join('\n');

//       // Create downloadable file
//       const blob = new Blob(
//         [csv],
//         {
//           type: 'text/csv;charset=utf-8;',
//         }
//       );

//       const url = URL.createObjectURL(blob);

//       const link = document.createElement('a');

//       link.href = url;

//       link.download = `Payroll_Report_${year}_${String(
//         month
//       ).padStart(2, '0')}.csv`;

//       document.body.appendChild(link);

//       link.click();

//       document.body.removeChild(link);

//       URL.revokeObjectURL(url);
//     } catch (error) {
//       console.error(
//         'Download report error:',
//         error
//       );

//       alert('Unable to download report.');
//     }
//   }

//   return (
//     <Layout
//       title={
//         <div className="flex items-center gap-1">
//           <Link
//             href="/dashboard"
//             aria-label="Back to Dashboard"
//             className="flex h-7 w-7 items-center justify-center text-slate-800"
//           >
//             <ArrowLeft size={20} />
//           </Link>

//           <span>Payroll</span>
//         </div>
//       }
//     >
//       <section className="card mx-auto max-w-4xl p-5 sm:p-6">

//         {/* TITLE */}
//         <h2 className="m-0 text-lg font-bold text-slate-800">
//           Monthly Payroll
//         </h2>

//         <p className="mt-1 text-sm text-slate-500">
//           Calculate payroll based on attendance.
//         </p>

//         {/* MONTH / YEAR / BUTTONS */}
//         <div className="mt-5 grid gap-3 sm:grid-cols-4">

//           {/* MONTH */}
//           <select
//             className="field"
//             value={month}
//             onChange={(event) => {
//               setMonth(Number(event.target.value));
//               setReport([]);
//             }}
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

//           {/* YEAR */}
//           <input
//             className="field"
//             type="number"
//             value={year}
//             onChange={(event) => {
//               setYear(Number(event.target.value));
//               setReport([]);
//             }}
//           />

//           {/* CALCULATE */}
//           <button
//             type="button"
//             className="btn-primary"
//             disabled={loading}
//             onClick={calculate}
//           >
//             {loading
//               ? 'Calculating...'
//               : 'Calculate Payroll'}
//           </button>

//           {/* DOWNLOAD */}
//           <button
//             type="button"
//             className="btn-secondary flex items-center justify-center gap-2"
//             disabled={!report.length}
//             onClick={downloadReport}
//           >
//             <Download size={16} />

//             Download Report
//           </button>

//         </div>

//         {/* REPORT */}
//         {report.length > 0 && (
//           <div className="mt-6 overflow-x-auto">

//             <h3 className="mb-3 text-lg font-bold text-slate-800">
//               Payroll Report
//             </h3>

//             <table className="w-full border-collapse">

//               <thead>
//                 <tr className="border-b border-slate-200 text-left">

//                   <th className="px-2 py-2 text-xs font-semibold text-slate-500">
//                     Teacher Name
//                   </th>

//                   <th className="px-2 py-2 text-xs font-semibold text-slate-500">
//                     Present
//                   </th>

//                   <th className="px-2 py-2 text-xs font-semibold text-slate-500">
//                     Absent
//                   </th>

//                   <th className="px-2 py-2 text-xs font-semibold text-slate-500">
//                     Salary
//                   </th>

//                 </tr>
//               </thead>

//               <tbody>
//                 {report.map((teacher) => (
//                   <tr
//                     key={teacher.id}
//                     className="border-b border-slate-100"
//                   >

//                     <td className="px-2 py-2 text-sm font-semibold text-slate-800">
//                       {teacher.name}
//                     </td>

//                     <td className="px-2 py-2 text-sm text-slate-700">
//                       {teacher.present}
//                     </td>

//                     <td className="px-2 py-2 text-sm text-slate-700">
//                       {teacher.absent}
//                     </td>

//                     <td className="px-2 py-2 text-sm font-semibold text-slate-800">
//                       {money(teacher.salary)}
//                     </td>

//                   </tr>
//                 ))}
//               </tbody>

//             </table>

//           </div>
//         )}

//       </section>
//     </Layout>
//   );
// }






import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';
import Layout from '@/components/Layout';
import { calculatePayroll } from '@/lib/payroll';

export default function Payroll() {
  const [teachers, setTeachers] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);

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

        setTeachers(data.teachers || []);
      } catch (error) {
        console.error(error);
        setTeachers([]);
      }
    }

    loadTeachers();
  }, []);

  function getDateRange() {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;

    const end = new Date(year, Number(month), 0)
      .toISOString()
      .slice(0, 10);

    return { start, end };
  }

  async function calculate() {
    if (!teachers.length) {
      alert('No teachers found.');
      return;
    }

    setLoading(true);
    setReport([]);

    try {
      const { start, end } = getDateRange();

      const results = await Promise.all(
        teachers.map(async (teacher) => {
          try {
            const response = await fetch(
              `/api/attendance?teacherId=${encodeURIComponent(
                teacher.id
              )}&start=${start}&end=${end}`
            );

            const data = await response.json();

            if (!response.ok) {
              throw new Error(
                data.error || 'Unable to load attendance.'
              );
            }

            const attendance = data.attendance || [];

            const present = attendance.filter(
              (entry) => entry.status === 'present'
            ).length;

            const absent = attendance.filter(
              (entry) =>
                entry.status === 'absent' ||
                entry.status === 'unpaid_leave'
            ).length;

            const payroll = calculatePayroll({
              monthlySalary: teacher.monthly_salary || 0,
              workingDays: 26,
              presentDays: present,
              halfDays: 0,
              paidLeaveDays: 0,
              unpaidLeaveDays: absent,
            });

            return {
              id: teacher.id,
              name:
                teacher.full_name || 'Unnamed teacher',
              present,
              absent,
              salary: payroll.netPay || 0,
            };
          } catch (error) {
            console.error(error);

            return {
              id: teacher.id,
              name:
                teacher.full_name || 'Unnamed teacher',
              present: 0,
              absent: 0,
              salary: Number(
                teacher.monthly_salary || 0
              ),
            };
          }
        })
      );

      // Store only for download.
      // Nothing will be displayed on the page.
      setReport(results);
    } catch (error) {
      console.error(error);
      alert('Unable to calculate payroll.');
    } finally {
      setLoading(false);
    }
  }

  function downloadReport() {
    if (!report || report.length === 0) {
      alert('Please calculate payroll first.');
      return;
    }

    try {
      const header =
        'Teacher Name,Present,Absent,Salary';

      const rows = report.map((teacher) => {
        const name = `"${String(
          teacher.name
        ).replace(/"/g, '""')}"`;

        return [
          name,
          teacher.present,
          teacher.absent,
          teacher.salary,
        ].join(',');
      });

      const csv = [header, ...rows].join('\n');

      const blob = new Blob(
        [csv],
        {
          type: 'text/csv;charset=utf-8;',
        }
      );

      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');

      link.href = url;

      link.download =
        `Payroll_Report_${year}_${String(month).padStart(
          2,
          '0'
        )}.csv`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Unable to download report.');
    }
  }

  return (
    <Layout
      title={
        <div className="flex items-center gap-1">
          <Link
            href="/dashboard"
            aria-label="Back to Dashboard"
            className="flex h-7 w-7 items-center justify-center text-slate-800"
          >
            <ArrowLeft size={20} />
          </Link>

          <span>Payroll</span>
        </div>
      }
    >
      <section className="card mx-auto max-w-4xl p-5 sm:p-6">

        <h2 className="m-0 text-lg font-bold text-slate-800">
          Monthly Payroll
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Calculate payroll based on attendance.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">

          {/* MONTH */}
          <select
            className="field"
            value={month}
            onChange={(event) => {
              setMonth(Number(event.target.value));
              setReport([]);
            }}
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

          {/* YEAR */}
          <input
            className="field"
            type="number"
            value={year}
            onChange={(event) => {
              setYear(Number(event.target.value));
              setReport([]);
            }}
          />

          {/* CALCULATE */}
          <button
            type="button"
            className="btn-primary"
            disabled={loading}
            onClick={calculate}
          >
            {loading
              ? 'Calculating...'
              : 'Calculate Payroll'}
          </button>

          {/* DOWNLOAD */}
          <button
            type="button"
            className="btn-secondary flex items-center justify-center gap-2"
            disabled={!report.length || loading}
            onClick={downloadReport}
          >
            <Download size={16} />

            Download Report
          </button>

        </div>

      </section>
    </Layout>
  );
}