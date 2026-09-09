import { faceDistance, isFaceDescriptor } from '@/lib/faceDescriptor';

// A duplicate must be a very close match. This is intentionally stricter
// than attendance recognition, which must tolerate normal camera variation.
const DEFAULT_DUPLICATE_DISTANCE = 0.35;
const MIN_ENROLLMENT_FRAMES = 3;

export function duplicateFaceThreshold() {
  // FACE_DUPLICATE_THRESHOLD is deliberately separate from the more lenient
  // attendance verification threshold. It is the only duplicate cutoff.
  const configured = Number(process.env.FACE_DUPLICATE_THRESHOLD);
  return Number.isFinite(configured)
    ? Math.min(Math.max(configured, 0.2), DEFAULT_DUPLICATE_DISTANCE)
    : DEFAULT_DUPLICATE_DISTANCE;
}

export function enrollmentDescriptor(body) {
  const supplied = body.faceDescriptors || body.faceDescriptor;
  const descriptors = Array.isArray(supplied) && supplied.every(isFaceDescriptor)
      ? supplied
      : null;

  if (!descriptors || descriptors.length < MIN_ENROLLMENT_FRAMES) return null;

  // A copied/default descriptor would be identical in every "frame". Do not
  // turn that into an apparently valid enrollment vector.
  const hasFreshFrames = descriptors.some((item, index) =>
    index > 0 && faceDistance(item, descriptors[0]) > 0.0001
  );
  if (!hasFreshFrames) return null;

  const averaged = descriptors[0].map((_, index) =>
    descriptors.reduce((sum, descriptor) => sum + descriptor[index], 0) / descriptors.length
  );
  const magnitude = Math.hypot(...averaged);

  return magnitude > 0
    ? averaged.map((value) => value / magnitude)
    : null;
}

export function closestDifferentTeacherMatch(faceDescriptor, teachers, selectedTeacherId) {
  return teachers.reduce((closest, teacher) => {
    if (
      String(teacher.id) === String(selectedTeacherId) ||
      !isFaceDescriptor(teacher.face_descriptor)
    ) {
      return closest;
    }

    const distance = faceDistance(faceDescriptor, teacher.face_descriptor);
    return !closest || distance < closest.distance
      ? { id: teacher.id, fullName: teacher.full_name, distance }
      : closest;
  }, null);
}

export function isConfirmedDuplicate(match) {
  return Boolean(match && match.distance <= duplicateFaceThreshold());
}
