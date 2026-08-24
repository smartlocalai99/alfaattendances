import { useEffect, useState } from 'react';
import FaceCamera from '@/components/FaceCamera';

export default function FaceEnrollmentModal({ teacherId, onComplete }) {
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const redirect = window.setTimeout(onComplete, 1200);
    return () => window.clearTimeout(redirect);
  }, [done, onComplete]);

  async function saveFace() {
    if (!faceDescriptor || saving) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/face/enroll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teacherId, faceDescriptor }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save the face.');
      setDone(true);
    } catch (saveError) {
      setError(saveError.message);
      setSaving(false);
    }
  }

  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"><section className="card w-full max-w-xl p-5 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="enroll-title"><h2 id="enroll-title" className="mt-0 text-xl">Enroll Teacher Face</h2>{done ? <div className="rounded-xl bg-emerald-50 p-4 text-emerald-900"><b>Teacher and face enrolled successfully</b></div> : <><FaceCamera onCapture={setFaceDescriptor} readyMessage="Position your face in the frame" processingMessage="Processing face..." successMessage="Face detected. Ready to save."/>{error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button className="btn-primary mt-4 w-full" disabled={!faceDescriptor || saving} onClick={saveFace}>{saving ? 'Saving…' : 'Save Face'}</button></>}</section></div>;
}
