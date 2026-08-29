import { admin } from '@/lib/supabaseAdmin';
import { clearEnrolledFacesCache } from '@/lib/enrolledFaces';
import { isFaceDescriptor } from '@/lib/faceDescriptor';
import {
  closestDifferentTeacherMatch,
  duplicateFaceThreshold,
  enrollmentDescriptor,
  isConfirmedDuplicate,
} from '@/lib/faceEnrollment';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const db = admin();
    const { teacherId } = req.body || {};
    const faceDescriptor = enrollmentDescriptor(req.body || {});
    if (!teacherId || !faceDescriptor) throw new Error('Invalid enrollment data.');

    const target = await db.from('teachers').select('id,full_name,face_descriptor').eq('id', teacherId).maybeSingle();
    if (target.error) throw target.error;
    if (!target.data) return res.status(404).json({ error: 'The selected teacher was not found.' });

    const alreadyEnrolled = isFaceDescriptor(target.data.face_descriptor);
    const existingFaces = await db.from('teachers').select('id,full_name,face_descriptor');
    if (existingFaces.error) throw existingFaces.error;
    const match = closestDifferentTeacherMatch(faceDescriptor, existingFaces.data || [], teacherId);
    const duplicate = isConfirmedDuplicate(match);

    console.info('Face enrollment duplicate check', {
      selectedTeacherId: teacherId,
      matchedTeacherId: match?.id || null,
      matchedTeacherName: match?.fullName || null,
      similarityScore: match ? Number(match.distance.toFixed(4)) : null,
      duplicateThreshold: duplicateFaceThreshold(),
      duplicate,
    });

    if (duplicate) {
      return res.status(409).json({
        error: `This face is already linked to ${match.fullName}. Select the correct teacher or use a different face.`,
        code: 'DUPLICATE_FACE',
        match: { id: match.id, fullName: match.fullName, similarityScore: Number(match.distance.toFixed(4)) },
      });
    }

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
    clearEnrolledFacesCache();
    return res.json({
      ok: true,
      teacher: {
        id: saved.data.id,
        fullName: saved.data.full_name,
        face_enrolled: isFaceDescriptor(saved.data.face_descriptor),
        replaced_existing_face: alreadyEnrolled,
      },
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to enroll face.' });
  }
}
