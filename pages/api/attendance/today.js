import { admin } from '@/lib/supabaseAdmin';

const timezone = process.env.SCHOOL_TIMEZONE || 'Asia/Kolkata';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
  try {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date());
    const db = admin();
    const [teachersResult, attendanceResult] = await Promise.all([
      db.from('teachers').select('id,full_name,employee_id,subject,monthly_salary,status').order('full_name'),
      db.from('attendance').select('id,teacher_id,attendance_date,in_time,out_time,status,verification_method,updated_at').eq('attendance_date', today),
    ]);
    if (teachersResult.error) throw teachersResult.error;
    if (attendanceResult.error) throw attendanceResult.error;
    const attendanceByTeacher = new Map((attendanceResult.data || []).map((record) => [record.teacher_id, record]));
    const teachers = (teachersResult.data || []).map((teacher) => ({ ...teacher, attendance: attendanceByTeacher.get(teacher.id) || null }));
    return res.status(200).json({ date: today, teachers });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to load attendance.' });
  }
}
