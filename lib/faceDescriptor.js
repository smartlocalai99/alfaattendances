export function isFaceDescriptor(value) {
  if (!Array.isArray(value) || value.length !== 128 || !value.every((item) => typeof item === 'number' && Number.isFinite(item))) {
    return false;
  }

  // face-api.js returns L2-normalized 128-dimensional descriptors. This
  // rejects empty, zero, and synthetic fallback vectors without logging them.
  const magnitude = Math.hypot(...value);
  return magnitude >= 0.75 && magnitude <= 1.25;
}

export function faceDistance(first, second) {
  return Math.sqrt(
    first.reduce((sum, value, index) => sum + (value - second[index]) ** 2, 0)
  );
}
