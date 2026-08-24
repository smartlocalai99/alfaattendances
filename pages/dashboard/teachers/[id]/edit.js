import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import TeacherForm from '@/components/TeacherForm';
import FaceEnrollmentModal from '@/components/FaceEnrollmentModal';
import { requireSupabase } from '@/lib/supabaseClient';

export default function EditTeacher() {
  const router = useRouter();
  const [teacher, setTeacher] = useState(null);
  const [savedTeacherId, setSavedTeacherId] = useState('');

  useEffect(() => {
    if (!router.query.id) return;
    requireSupabase().from('teachers').select('*').eq('id', router.query.id).single().then(({ data }) => setTeacher(data));
  }, [router.query.id]);

  async function save(form) {
    const { error } = await requireSupabase().from('teachers').update({
      ...form,
      monthly_salary: form.monthly_salary == null || form.monthly_salary === '' ? 0 : Number(form.monthly_salary),
    }).eq('id', router.query.id);
    if (error) return alert(error.message);
    setSavedTeacherId(router.query.id);
  }

  return <Layout title="Edit Teacher" description="Update teacher information" backHref={router.query.id ? `/dashboard/teachers/${router.query.id}` : '/dashboard'}><div className="card mx-auto max-w-3xl p-6">{teacher ? <TeacherForm initial={teacher} onSubmit={save} submitText="Save Teacher"/> : <p>Loading…</p>}</div>{savedTeacherId && <FaceEnrollmentModal teacherId={savedTeacherId} onComplete={() => router.push('/dashboard')}/>}</Layout>;
}
