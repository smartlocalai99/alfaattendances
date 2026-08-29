import { useCallback, useEffect, useState } from 'react';
import FaceCamera from '@/components/FaceCamera';

export default function FaceEnrollmentModal({ teacherId, teacherName, onComplete, onSaved }) {
  const [faceDescriptors, setFaceDescriptors] = useState(null);
  const [saving, setSaving] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicateMatch, setDuplicateMatch] = useState(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const redirect = window.setTimeout(onComplete, 1200);
    return () => window.clearTimeout(redirect);
  }, [done, onComplete]);

  const checkDuplicate = useCallback(async (capturedDescriptors) => {
    setFaceDescriptors(capturedDescriptors);
    setDuplicateMatch(null);
    setError('');
    setCheckingDuplicate(true);

    try {
      const response = await fetch('/api/face/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId, faceDescriptors: capturedDescriptors }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to validate the face.');
      setDuplicateMatch(data.duplicate ? data.match : null);
    } catch (checkError) {
      setFaceDescriptors(null);
      setError(checkError.message);
      throw checkError;
    } finally {
      setCheckingDuplicate(false);
    }
  }, [teacherId]);

  async function saveFace() {
    if (!faceDescriptors || saving || checkingDuplicate || duplicateMatch) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/face/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId, faceDescriptors }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.code === 'DUPLICATE_FACE') setDuplicateMatch(data.match);
        throw new Error(data.error || 'Unable to save the face.');
      }
      onSaved?.(data.teacher);
      setDuplicateMatch(null);
      setError('');
      setDone(true);
    } catch (saveError) {
      setError(saveError.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-3 sm:p-6">
      <section className="card mx-auto w-full max-w-xl p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="enroll-title">
        <div className="mb-4">
          <h2 id="enroll-title" className="m-0 text-xl font-bold">Enroll Face{teacherName ? `: ${teacherName}` : ''}</h2>
          <p className="mb-0 mt-1 text-sm text-slate-500">Center one face within the white guide.</p>
        </div>

        {done ? (
          <div className="rounded-xl bg-emerald-50 p-4 text-emerald-900"><b>Teacher and face enrolled successfully</b></div>
        ) : (
          <>
            <FaceCamera
              onCapture={checkDuplicate}
              readyMessage="Detecting Face..."
              processingMessage="Verifying..."
              successMessage="Face detected. Ready to save."
            />
            {duplicateMatch ? (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">This face is already linked to {duplicateMatch.fullName}. Select the correct teacher or use a different face.</p>
            ) : error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <button className="btn-primary mt-4 w-full" disabled={!faceDescriptors || saving || checkingDuplicate || Boolean(duplicateMatch)} onClick={saveFace}>
              {checkingDuplicate ? 'Checking face...' : saving ? 'Saving...' : 'Save Face'}
            </button>
          </>
        )}
      </section>
    </div>
  );
}
