import { admin } from '@/lib/supabaseAdmin';

const distance = (first, second) => Math.sqrt(first.reduce((sum, value, index) => sum + (value - second[index]) ** 2, 0));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { faceDescriptor } = req.body;
    if (!Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) throw new Error('Invalid face data.');
    const db = admin();
    const list = await db.from('teachers').select('id,full_name,face_descriptor').eq('status', 'active').eq('face_enrolled', true);
    if (list.error) throw list.error;
    let match = null;
    (list.data || []).forEach((teacher) => {
      const value = distance(faceDescriptor, teacher.face_descriptor);
      if (!match || value < match.distance) match = { ...teacher, distance: value };
    });
    const threshold = Number(process.env.FACE_MATCH_THRESHOLD || process.env.NEXT_PUBLIC_FACE_MATCH_THRESHOLD || 0.48);
    if (!match || match.distance > threshold) return res.status(401).json({ error: 'Face not recognized. Please try again or contact administrator.' });

    const attendanceDate = new Intl.DateTimeFormat('en-CA', { timeZone: process.env.SCHOOL_TIMEZONE || 'Asia/Kolkata' }).format(new Date());
    const found = await db.from('attendance').select('*').eq('teacher_id', match.id).eq('attendance_date', attendanceDate).maybeSingle();
    if (found.error) throw found.error;
    let action;
    let result;
    if (!found.data) {
      action = 'in';
      result = await db.from('attendance').insert({ teacher_id: match.id, attendance_date: attendanceDate, in_time: new Date().toISOString(), status: 'present', verification_method: 'face' }).select().single();
    } else if (!found.data.in_time) {
      return res.status(409).json({ error: 'Please mark IN before marking OUT.' });
    } else if (!found.data.out_time) {
      action = 'out';
      result = await db.from('attendance').update({ out_time: new Date().toISOString() }).eq('id', found.data.id).select().single();
    } else {
      return res.status(409).json({ error: 'OUT is already marked for today.' });
    }
    if (result.error) throw result.error;
    return res.json({ teacher: match.full_name, action, attendance: result.data });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to verify attendance.' });
  }
}
