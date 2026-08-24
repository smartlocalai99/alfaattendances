import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { durationBetween, money } from '@/lib/payroll';

export default function TeacherProfile() {
  const router = useRouter();
  const [teacher, setTeacher] = useState(null);

  useEffect(() => {
    if (!router.query.id) return;
    fetch(`/api/teachers/${router.query.id}`).then((response) => response.ok ? response.json() : null).then(setTeacher);
  }, [router.query.id]);

  if (!teacher) return <Layout title="Teacher Details" description="View teacher information" backHref="/dashboard"><p>Loading…</p></Layout>;

  return <Layout title="Teacher Details" description="View teacher information" backHref="/dashboard" action={<Link href={`/dashboard/teachers/${teacher.id}/edit`} className="btn-secondary">Edit teacher</Link>}><div className="grid gap-6 lg:grid-cols-3"><section className="card p-6"><h2 className="mt-0">{teacher.full_name}</h2>{[['Employee ID', teacher.employee_id], ['Email', teacher.email], ['Phone', teacher.phone], ['Subject', teacher.subject], ['Qualification', teacher.qualification], ['Joining Date', teacher.joining_date], ['Working Hours', teacher.working_hours], ['Monthly Salary', money(teacher.monthly_salary)], ['Status', teacher.status], ['Face enrollment', teacher.face_enrolled ? 'Enrolled ✓' : 'Not enrolled']].map(([label, value]) => <p key={label} className="border-b py-2 text-sm"><span className="text-slate-500">{label}</span><br/><b>{value || '—'}</b></p>)}<Link href={`/attendance/enroll?teacherId=${teacher.id}`} className="btn-primary mt-3 block text-center">{teacher.face_enrolled ? 'Re-enroll Face' : 'Enroll Face'}</Link><p className="mb-0 mt-3 text-xs text-slate-500">Face enrollment opens within this application.</p></section><section className="card p-5 lg:col-span-2"><h2 className="mt-0">Attendance History</h2><div className="table-wrap"><table><thead><tr><th>Date</th><th>IN</th><th>OUT</th><th>Hours</th><th>Status</th></tr></thead><tbody>{teacher.attendance?.sort((first, second) => second.attendance_date.localeCompare(first.attendance_date)).map((record) => <tr key={record.id}><td>{record.attendance_date}</td><td>{record.in_time && new Date(record.in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td><td>{record.out_time && new Date(record.out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td><td>{durationBetween(record.in_time, record.out_time)}</td><td>{record.status}</td></tr>)}</tbody></table></div></section></div></Layout>;
}
