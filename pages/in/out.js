import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';
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

export default function AttendanceTiming() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/attendance/today');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || 'Unable to load attendance.'
          );
        }

        setRows(
          (data.teachers || []).filter(
            (teacher) => teacher.status === 'active'
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
      <div className="card w-full max-w-full overflow-hidden p-3 sm:p-4">

        {/* Header */}
        <div className="mb-3">
          <h2 className="m-0 text-sm font-bold text-slate-800">
            Today’s Attendance
          </h2>

          <p className="mb-0 mt-1 text-[9px] text-slate-500">
            Timing records are marked by face verification.
          </p>
        </div>

        {/* Table */}
        <div className="w-full overflow-hidden">
          <table className="w-full table-fixed border-collapse">

            <colgroup>
              {/* Name */}
              <col className="w-[30%]" />

              {/* In / Out */}
              <col className="w-[25%]" />

              {/* Working Time */}
              <col className="w-[45%]" />
            </colgroup>

            <thead>
              <tr className="border-b border-slate-200">

                {/* NAME */}
                <th className="m-0 p-0 py-2 text-left text-[8px] font-semibold uppercase text-slate-500">
                  Name
                </th>

                {/* IN / OUT */}
                <th className="m-0 p-0 py-2 text-left text-[8px] font-semibold uppercase text-slate-500">
                  In / Out
                </th>

                {/* WORKING TIME */}
                <th className="m-0 p-0 py-2 text-left text-[8px] font-semibold uppercase text-slate-500">
                  Working Time
                </th>

              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="py-4 text-center text-xs text-slate-500"
                  >
                    Loading attendance...
                  </td>
                </tr>
              ) : rows.length > 0 ? (
                rows.map((teacher) => {
                  const record = teacher.attendance;

                  return (
                    <tr
                      key={teacher.id}
                      className="border-b border-slate-100"
                    >

                      {/* NAME */}
                      <td className="truncate m-0 p-0 py-1.5 text-[9px] font-semibold text-slate-800">
                        {teacher.full_name || 'Unnamed teacher'}
                      </td>

                      {/* IN / OUT */}
                      <td className="m-0 p-0 py-1.5 text-left text-[9px] whitespace-nowrap text-slate-700">
                        {time(record?.in_time)} / {time(record?.out_time)}
                      </td>

                      {/* WORKING TIME */}
                      <td className="m-0 p-0 py-1.5 text-left text-[9px] whitespace-nowrap font-medium text-slate-700">
                        {durationBetween(
                          record?.in_time,
                          record?.out_time
                        )}
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="py-4 text-center text-xs text-slate-500"
                  >
                    No active teachers found.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

      </div>
    </Layout>
  );
}