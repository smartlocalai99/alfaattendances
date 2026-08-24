import { admin } from '@/lib/supabaseAdmin';

const distance = (first, second) => Math.sqrt(first.reduce((sum, value, index) => sum + (value - second[index]) ** 2, 0));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const db = admin();
    const { teacherId, faceDescriptor } = req.body;
    if (!teacherId || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) throw new Error('Invalid enrollment data.');
    const existingFaces = await db.from('teachers').select('id,face_descriptor').eq('face_enrolled', true).neq('id', teacherId);
    if (existingFaces.error) throw existingFaces.error;
    const duplicateThreshold = Number(process.env.FACE_DUPLICATE_THRESHOLD || process.env.FACE_MATCH_THRESHOLD || process.env.NEXT_PUBLIC_FACE_MATCH_THRESHOLD || 0.48);
    const duplicate = (existingFaces.data || []).some((teacher) => Array.isArray(teacher.face_descriptor) && teacher.face_descriptor.length === 128 && distance(faceDescriptor, teacher.face_descriptor) <= duplicateThreshold);
    if (duplicate) return res.status(409).json({ error: 'This face is already enrolled for another teacher.' });

    const saved = await db.from('teachers').update({ face_descriptor: faceDescriptor, face_enrolled: true }).eq('id', teacherId).select('id').single();
    if (saved.error) throw saved.error;
    return res.json({ ok: true });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to enroll face.' });
  }
}
