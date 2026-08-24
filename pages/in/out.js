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
    : 'Not marked';

export default function AttendanceTiming() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const response = await fetch('/api/attendance/today');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setRows(
        data.teachers.filter(
          (teacher) => teacher.status === 'active'
        )
      );
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    window.addEventListener('focus', load);

    return () =>
      window.removeEventListener('focus', load);
  }, []);

  return (
    <Layout
      title={
        <div className="flex items-center gap-1">
          <Link
            href="/dashboard"
            aria-label="Back to Dashboard"
            className="flex h-7 w-7 items-center justify-center text-slate-800"
          >
            <ArrowLeft
              size={20}
              strokeWidth={2}
            />
          </Link>

          <span>IN / OUT</span>
        </div>
      }
      backHref={null}
    >
      <div className="card p-5">
        <div className="mb-5">
          <h2 className="m-0 text-lg font-bold">
            Today’s Attendance
          </h2>

          <p className="mb-0 mt-1 text-sm text-slate-500">
            Timing records are marked by face verification in the Attendance.
          </p>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Teacher</th>
                <th>IN</th>
                <th>OUT</th>
                <th>Working Time</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5">
                    Loading attendance…
                  </td>
                </tr>
              ) : (
                rows.map((teacher) => {
                  const record = teacher.attendance;

                  

                  return (
                    <tr key={teacher.id}>
                      <td>
                        <b>{teacher.full_name}</b>
                        <br />

                      </td>

                      <td>
                        {time(record?.in_time)}
                      </td>

                      <td>
                        {time(record?.out_time)}
                      </td>

                      <td>
                        {durationBetween(
                          record?.in_time,
                          record?.out_time
                        )}
                      </td>

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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}