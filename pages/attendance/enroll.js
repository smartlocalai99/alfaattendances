import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import FaceCamera from '@/components/FaceCamera';
import PageHeader from '@/components/PageHeader';

export default function EnrollFace() {
  const router = useRouter();
  const [teacher, setTeacher] = useState(null);
  const [done, setDone] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!router.isReady || !router.query.teacherId) return;
    setTeacher(null);
    setLoadError('');
    fetch(`/api/teachers/${router.query.teacherId}`).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Teacher not found.');
      return data;
    }).then(setTeacher).catch((error) => setLoadError(error.message));
  }, [router.isReady, router.query.teacherId]);

  async function enroll(faceDescriptor) {
    if (!teacher?.id) throw new Error('Teacher details are still loading. Please try again.');
    const response = await fetch('/api/face/enroll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teacherId: teacher.id, faceDescriptor }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setDone(true);
  }

  return <main className="min-h-screen"><header className="border-b border-slate-200 bg-white px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8"><PageHeader title={teacher?.face_enrolled ? 'Re-enroll Face' : 'Face Enrollment'} description="Register teacher face" backHref="/dashboard"/></header><div className="mx-auto grid min-h-[calc(100vh-96px)] max-w-2xl place-items-center p-4"><section className="card w-full p-6">{loadError ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{loadError}</p> : teacher ? <><p className="text-slate-600">Teacher: <b>{teacher.full_name}</b><br/>Look directly at the camera. Keep one clear, well-lit face visible. No raw image is saved.</p>{done ? <div className="rounded-xl bg-emerald-50 p-4 text-emerald-900"><b>Face detected ✓</b><br/>Face quality good ✓<br/>Teacher ready to enroll</div> : <FaceCamera label="Complete Enrollment" onCapture={enroll}/>}</> : <p>Loading teacher…</p>}</section></div></main>;
}
