import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import TeachersList from '@/components/TeachersList';

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
        throw new Error(data.error || 'Unable to load teachers');
      }

      setTeachers(data.teachers || []);
    } catch (error) {
      console.error(error);

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

  // Search teachers
  const rows = teachers.filter((teacher) =>
    (teacher.full_name || '')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Dashboard counts
  const activeStaff = teachers.filter(
    (teacher) => teacher.status === 'active'
  ).length;

  const present = teachers.filter(
    (teacher) =>
      teacher.attendance?.in_time &&
      !teacher.attendance?.out_time
  ).length;

  const absent = teachers.filter(
    (teacher) =>
      teacher.status === 'active' &&
      !teacher.attendance
  ).length;

  // Update teacher after face enrollment
  const updateTeacher = (updated) => {
    setTeachers((current) =>
      current.map((teacher) =>
        teacher.id === updated.id
          ? {
              ...teacher,
              face_enrolled: updated.face_enrolled,
            }
          : teacher
      )
    );
  };

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
      {/* Teacher Added Message */}
      {router.query.added === '1' && (
        <p className="mb-5 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
          Teacher saved successfully. Enroll their face whenever you are
          ready.
        </p>
      )}

      {/* Error */}
      {loadError && (
        <p className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {loadError}
        </p>
      )}

      {/* Today */}
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

      {/* Dashboard Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">

        {/* Active Staff */}
        <Link
          href="/dashboard/teachers"
          className="block rounded-[20px] focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
          aria-label="View active teachers"
        >
          <StatCard
            type="active"
            label="Active Staff"
            value={activeStaff}
            description="Registered"
          />
        </Link>

        {/* Present */}
        <StatCard
          type="present"
          label="Present"
          value={present}
          description={`${present} still on site`}
        />

        {/* Absent */}
        <StatCard
          type="absent"
          label="Absent"
          value={absent}
          description="No check-in"
          footer="today"
        />

        {/* Complaints */}
        <Link
          href="/complaints"
          className="block rounded-[20px] focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
          aria-label="View complaints"
        >
          <StatCard
            type="complaints"
            label="Complaints"
            value="View"
            description="View complaints"
          />
        </Link>
      </div>

      {/* Notes */}
      <section className="card mt-7 p-5 sm:p-6">
        <h2 className="m-0 text-lg font-bold">
          Notes
        </h2>

        <p className="mb-4 mt-1 text-sm text-slate-500">
          Add and review teacher notes.
        </p>

        <Link
          href="/notes"
          className="btn-primary"
        >
          Notes
        </Link>
      </section>

      {/* Teachers List */}
      <section className="card mt-7 overflow-hidden p-0">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <h2 className="m-0 text-lg font-bold">
            List of Teachers
          </h2>

          <input
            className="field w-full max-w-xs"
            placeholder="Search teachers..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {/* Teachers */}
        <div className="px-3 pb-3 sm:px-5 sm:pb-5">
          <TeachersList
            teachers={rows}
            onTeacherUpdated={updateTeacher}
          />
        </div>

      </section>
    </Layout>
  );
}
