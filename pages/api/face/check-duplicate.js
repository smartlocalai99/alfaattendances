import { admin } from '@/lib/supabaseAdmin';
import {
  closestDifferentTeacherMatch,
  duplicateFaceThreshold,
  enrollmentDescriptor,
  isConfirmedDuplicate,
} from '@/lib/faceEnrollment';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  try {
    const { teacherId } = req.body || {};
    const faceDescriptor = enrollmentDescriptor(req.body || {});
    if (!teacherId || !faceDescriptor) {
      return res.status(400).json({ error: 'Invalid enrollment data.' });
    }

    const result = await admin().from('teachers').select('id,full_name,face_descriptor');
    if (result.error) throw result.error;

    const match = closestDifferentTeacherMatch(faceDescriptor, result.data || [], teacherId);
    const duplicate = isConfirmedDuplicate(match);

    console.info('Face enrollment duplicate check', {
      selectedTeacherId: teacherId,
      matchedTeacherId: match?.id || null,
      matchedTeacherName: match?.fullName || null,
      similarityScore: match ? Number(match.distance.toFixed(4)) : null,
      duplicateThreshold: duplicateFaceThreshold(),
      duplicate,
    });

    return res.status(200).json({
      duplicate,
      match: duplicate
        ? { id: match.id, fullName: match.fullName, similarityScore: Number(match.distance.toFixed(4)) }
        : null,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to check the face.' });
  }
}
