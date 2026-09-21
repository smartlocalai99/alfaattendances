export function isFaceDescriptor(value) {
  if (!Array.isArray(value) || value.length !== 128 || !value.every((item) => typeof item === 'number' && Number.isFinite(item))) {
    return false;
  }

  // Different supported browser backends can return the same valid embedding
  // with a slightly different magnitude. Only reject unusable (zero) vectors;
  // callers normalize valid descriptors before matching or saving them.
  const magnitude = Math.hypot(...value);
  return magnitude > 0.000001 && magnitude < 100;
}

export function normalizeFaceDescriptor(value) {
  if (!isFaceDescriptor(value)) return null;

  const magnitude = Math.hypot(...value);
  return value.map((item) => item / magnitude);
}

export function faceDistance(first, second) {
  return Math.sqrt(
    first.reduce((sum, value, index) => sum + (value - second[index]) ** 2, 0)
  );
}
