import { admin } from '@/lib/supabaseAdmin';
import { faceDistance, isFaceDescriptor } from '@/lib/faceDescriptor';

const defaultMatchThreshold = 0.58;

function matchThreshold() {
  const configured = Number(process.env.FACE_MATCH_THRESHOLD || process.env.NEXT_PUBLIC_FACE_MATCH_THRESHOLD);
  // 0.48 is too strict for descriptors captured from different mobile-camera frames.
  return Number.isFinite(configured) ? Math.max(configured, defaultMatchThreshold) : defaultMatchThreshold;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { faceDescriptor } = req.body;
    if (!isFaceDescriptor(faceDescriptor)) throw new Error('Invalid face data.');
    const db = admin();
    const list = await db.from('teachers').select('id,full_name,face_descriptor').eq('status', 'active');
    if (list.error) throw list.error;
    const enrolledTeachers = (list.data || []).filter((teacher) => isFaceDescriptor(teacher.face_descriptor));
    if (!enrolledTeachers.length) {
      return res.status(401).json({ error: 'No enrolled teacher faces are available yet.' });
    }
    let match = null;
    enrolledTeachers.forEach((teacher) => {
      const value = faceDistance(faceDescriptor, teacher.face_descriptor);
      if (!match || value < match.distance) match = { ...teacher, distance: value };
    });
    if (!match || match.distance > matchThreshold()) {
      return res.status(401).json({ error: 'Face not recognized. Use a clear, front-facing view or update the enrolled face.' });
    }

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
