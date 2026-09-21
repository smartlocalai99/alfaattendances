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
    const frameCount = Array.isArray(req.body?.faceDescriptors) ? req.body.faceDescriptors.length : 0;
    const descriptorLength = Array.isArray(req.body?.faceDescriptors?.[0]) ? req.body.faceDescriptors[0].length : 0;
    console.info('Face enrollment capture received', { selectedTeacherId: teacherId || null, frameCount, embeddingLength: descriptorLength, embeddingValid: Boolean(faceDescriptor) });
    if (!teacherId || !faceDescriptor) {
      return res.status(400).json({ error: 'Invalid enrollment data.' });
    }

    const result = await admin().from('teachers').select('id,full_name,face_descriptor');
    if (result.error) throw result.error;

    const match = closestDifferentTeacherMatch(req.body?.faceDescriptors, result.data || [], teacherId);
    const duplicate = isConfirmedDuplicate(match);

    console.info('Face enrollment duplicate check', {
      selectedTeacherId: teacherId,
      matchedTeacherId: match?.id || null,
      matchedTeacherName: match?.fullName || null,
      distance: match ? Number(match.distance.toFixed(4)) : null,
      worstFrameDistance: match ? Number(match.worstDistance.toFixed(4)) : null,
      duplicateThreshold: duplicateFaceThreshold(),
      duplicate,
    });

    return res.status(200).json({
      duplicate,
      match: duplicate
        ? { id: match.id, fullName: match.fullName, distance: Number(match.distance.toFixed(4)) }
        : null,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to check the face.' });
  }
}
