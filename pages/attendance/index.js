import { useCallback, useEffect, useState } from 'react';
import FaceCamera from '@/components/FaceCamera';

const IST = 'Asia/Kolkata';
const time = (value) => new Date(value).toLocaleTimeString('en-IN', { timeZone: IST, hour: '2-digit', minute: '2-digit' });

export default function AttendanceKiosk() {
  const [result, setResult] = useState(null);
  const [activity, setActivity] = useState([]);

  const loadActivity = useCallback(async () => {
    try {
      const response = await fetch('/api/attendance/today');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setActivity(data.teachers.filter((teacher) => teacher.attendance).sort((first, second) => new Date(second.attendance.updated_at) - new Date(first.attendance.updated_at)).slice(0, 8));
    } catch {
      setActivity([]);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(loadActivity, 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadActivity]);

  const verify = useCallback(async (faceDescriptor) => {
    const response = await fetch('/api/face/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ faceDescriptor }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setResult(data);
    await loadActivity();
  }, [loadActivity]);

  return <main className="mx-auto min-h-screen max-w-5xl p-4 sm:p-8"><div className="mb-6 text-center"><div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-700 font-bold text-white">TA</div><h1 className="m-0 text-2xl font-bold">Teacher Attendance</h1><p className="text-slate-500">Today — {new Date().toLocaleDateString('en-IN', { timeZone: IST, day: '2-digit', month: 'long', year: 'numeric' })}</p></div><section className="card p-4 sm:p-6"><h2 className="mt-0 text-lg">Face Verification</h2><FaceCamera onCapture={verify}/>{result && <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-emerald-900"><b>Attendance marked successfully</b><p className="mb-0 mt-1 text-sm">{result.teacher} · {result.action === 'in' ? 'IN' : 'OUT'} at {time(result.action === 'in' ? result.attendance.in_time : result.attendance.out_time)}</p></div>}</section><section className="card mt-5 p-5"><h2 className="mt-0 text-lg">Today’s Activity</h2>{activity.length ? activity.map((teacher) => { const record = teacher.attendance; return <div key={teacher.id} className="flex justify-between border-t py-3 text-sm"><b>{teacher.full_name}</b><span>{record.out_time ? 'OUT' : 'IN'} {time(record.out_time || record.in_time)}</span></div>; }) : <p className="text-sm text-slate-500">No attendance activity yet.</p>}</section></main>;
}
