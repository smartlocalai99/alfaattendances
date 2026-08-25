import { useMemo, useState } from 'react';

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function MonthlyAttendanceReport() {
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const years = useMemo(
    () =>
      Array.from(
        { length: 6 },
        (_, index) => now.getFullYear() - 3 + index
      ),
    [now]
  );

  function downloadExcel() {
    // The current month and year are the complete report filters. All active
    // teachers are included by the report API, so no Employee ID is requested.
    window.location.assign(
      `/api/reports/monthly?month=${month}&year=${year}&download=excel`
    );
  }

  return (
    <section className="card mt-7 p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        {/* Title */}
        <div>
          <h2 className="m-0 text-lg font-bold">
            Monthly Attendance Report
          </h2>

          <p className="mb-0 mt-1 text-sm text-slate-500">
            Download a report for any month.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-end gap-2">
          {/* Month */}
          <label className="min-w-36">
            <span className="label">Month</span>

            <select
              className="field"
              value={month}
              onChange={(event) =>
                setMonth(Number(event.target.value))
              }
            >
              {monthNames.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          {/* Year */}
          <label className="min-w-28">
            <span className="label">Year</span>

            <select
              className="field"
              value={year}
              onChange={(event) =>
                setYear(Number(event.target.value))
              }
            >
              {years.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          {/* Download Excel */}
          <button
            type="button"
            className="btn-primary h-[42px] self-end"
            onClick={downloadExcel}
          >
            Download Report
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Report */}
      {report && (
        <div className="mt-6">
          <h3 className="m-0 text-base font-bold">
            {report.period} Summary
          </h3>

          {/* Summary Cards */}
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[
              ['Total Teachers', report.summary.totalTeachers],
              ['Working Days', report.summary.totalWorkingDays],
              ['Total Present', report.summary.totalPresent],
              ['Total Absent', report.summary.totalAbsent],
              [
                'Attendance',
                `${report.summary.attendancePercentage}%`,
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl bg-slate-50 p-3"
              >
                <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                  {label}
                </span>

                <b className="mt-1 block text-xl">
                  {value}
                </b>
              </div>
            ))}
          </div>

          {/* Teacher-wise Attendance Table */}
          <div className="table-wrap mt-5">
            <table>
              <thead>
                <tr>
                  <th>Teacher Name</th>
                  <th>Subject</th>
                  <th>Present Days</th>
                  <th>Absent Days</th>
                  <th>Attendance Percentage</th>
                </tr>
              </thead>

              <tbody>
                {report.teachers &&
                report.teachers.length > 0 ? (
                  report.teachers.map((teacher, index) => (
                    <tr
                      key={
                        teacher.id ||
                        `${teacher.name}-${teacher.subject}-${index}`
                      }
                    >
                      <td>
                        <b>{teacher.name}</b>
                      </td>

                      <td>{teacher.subject || '-'}</td>

                      <td>{teacher.present ?? 0}</td>

                      <td>{teacher.absent ?? 0}</td>

                      <td>
                        {teacher.attendancePercentage ?? 0}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-center text-slate-500"
                    >
                      No attendance data found for this month.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
