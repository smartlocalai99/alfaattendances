import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
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

    return () => window.removeEventListener('focus', load);
  }, []);

  const rows = teachers.filter((teacher) =>
    teacher.full_name.toLowerCase().includes(search.toLowerCase())
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

  // Teacher has no attendance marked today
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
          + Enroll Teacher
        </Link>
      }
    >
      {router.query.enrolled === '1' && (
        <p className="mb-5 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
          Teacher enrolled successfully.
        </p>
      )}

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
          })}{' '}
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

      <section className="card mt-7 p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <h2 className="m-0 text-lg font-bold">
            List of Teachers
          </h2>

          <input
            className="field max-w-xs"
            placeholder="Search teachers…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Subject</th>
                <th>Today's IN</th>
                <th>Today's OUT</th>
                <th>Working Hours</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((teacher) => {
                const record = teacher.attendance;

                const status = !record
                  ? 'Not Marked'
                  : record.out_time
                  ? 'Present'
                  : 'Currently IN';

                return (
                  <tr key={teacher.id}>
                    <td>
                      <b>{teacher.full_name}</b>
                      <br />
                     
                    </td>

                    <td>
                      {teacher.subject || '—'}
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

                    <td>
                     
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </Layout>
  );
}


