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
                const record = teacher.attendance;

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
                        {teacher.full_name || 'Unnamed teacher'}
                      </span>
                    </div>

                    {/* IN / OUT */}
                    <div className="min-w-0 overflow-hidden py-2 px-1 text-left text-[8px] whitespace-nowrap text-slate-700">
                      {time(record?.in_time)} / {time(record?.out_time)}
                    </div>

                    {/* WORK HR */}
                    <div className="min-w-0 overflow-hidden py-2 pl-1 text-left text-[8px] font-semibold whitespace-nowrap text-slate-700">
                      {record?.in_time
                        ? durationBetween(
                            record.in_time,
                            record.out_time
                          )
                        : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No Data */}
          {!loading && rows.length === 0 && (
            <div className="py-4 text-center text-xs text-slate-500">
              No active teachers found.
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}