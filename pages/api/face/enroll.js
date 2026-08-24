import { admin } from '@/lib/supabaseAdmin';
import { faceDistance, isFaceDescriptor } from '@/lib/faceDescriptor';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const db = admin();
    const { teacherId, faceDescriptor } = req.body;
    if (!teacherId || !isFaceDescriptor(faceDescriptor)) throw new Error('Invalid enrollment data.');
    const existingFaces = await db.from('teachers').select('id,face_descriptor').neq('id', teacherId);
    if (existingFaces.error) throw existingFaces.error;
    const duplicateThreshold = Number(process.env.FACE_DUPLICATE_THRESHOLD || process.env.FACE_MATCH_THRESHOLD || process.env.NEXT_PUBLIC_FACE_MATCH_THRESHOLD || 0.48);
    const duplicate = (existingFaces.data || []).some((teacher) =>
      isFaceDescriptor(teacher.face_descriptor)
      && faceDistance(faceDescriptor, teacher.face_descriptor) <= duplicateThreshold
    );
    if (duplicate) return res.status(409).json({ error: 'This face is already enrolled for another teacher.' });

    const saved = await db
      .from('teachers')
      .update({ face_descriptor: faceDescriptor, face_enrolled: true })
      .eq('id', teacherId)
      .select('id,full_name,face_descriptor,face_enrolled')
      .single();
    if (saved.error) throw saved.error;
    if (!isFaceDescriptor(saved.data.face_descriptor)) {
      throw new Error('Face enrollment could not be verified after saving. Please try again.');
    }
    return res.json({
      ok: true,
      teacher: {
        id: saved.data.id,
        fullName: saved.data.full_name,
        face_enrolled: isFaceDescriptor(saved.data.face_descriptor),
      },
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to enroll face.' });
  }
}
