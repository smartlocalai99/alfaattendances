export function isFaceDescriptor(value) {
  return Array.isArray(value)
    && value.length === 128
    && value.every((item) => typeof item === 'number' && Number.isFinite(item));
}

export function faceDistance(first, second) {
  return Math.sqrt(
    first.reduce((sum, value, index) => sum + (value - second[index]) ** 2, 0)
  );
}
