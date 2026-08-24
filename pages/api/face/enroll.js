import { admin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const db = admin();
    const { teacherId, faceDescriptor } = req.body;
    if (!teacherId || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) throw new Error('Invalid enrollment data.');
    const saved = await db.from('teachers').update({ face_descriptor: faceDescriptor, face_enrolled: true }).eq('id', teacherId);
    if (saved.error) throw saved.error;
    return res.json({ ok: true });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to enroll face.' });
  }
}
