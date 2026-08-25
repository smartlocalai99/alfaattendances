import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import TeachersList from '@/components/TeachersList';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/attendance/today');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setTeachers((data.teachers || []).filter((teacher) => teacher.status === 'active'));
      } catch (loadError) {
        setError(loadError.message || 'Unable to load teachers.');
      }
    }
    load();
  }, []);

  return <Layout title={<div className="flex items-center gap-1"><Link href="/dashboard" aria-label="Back to Dashboard" className="flex h-7 w-7 items-center justify-center text-slate-800"><ArrowLeft size={20} /></Link><span>Teachers List</span></div>}>
    {error && <p className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <section className="card max-w-3xl overflow-hidden p-0"><div className="p-5"><h2 className="m-0 text-lg font-bold">Active Teachers</h2></div><TeachersList teachers={teachers} onTeacherUpdated={(updated) => setTeachers((current) => current.map((teacher) => teacher.id === updated.id ? { ...teacher, face_enrolled: updated.face_enrolled } : teacher))} /></section>
  </Layout>;
}
