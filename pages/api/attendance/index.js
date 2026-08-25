import { admin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
  try {
    const teacherId = String(req.query.teacherId || '');
    const start = String(req.query.start || '');
    const end = String(req.query.end || '');
    if (!teacherId || !start || !end) return res.status(400).json({ error: 'Teacher and date range are required.' });
    const attendance = await admin()
      .from('attendance')
      .select('status')
      .eq('teacher_id', teacherId)
      .gte('attendance_date', start)
      .lte('attendance_date', end);
    if (attendance.error) throw attendance.error;
    return res.status(200).json({ attendance: attendance.data || [] });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to load attendance.' });
  }
}
