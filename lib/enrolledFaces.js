import { admin } from '@/lib/supabaseAdmin';
import { isFaceDescriptor } from '@/lib/faceDescriptor';

const cacheLifetimeMs = 60_000;
let cachedFaces = null;
let cachedAt = 0;
let loadingFaces = null;

export function clearEnrolledFacesCache() {
  cachedFaces = null;
  cachedAt = 0;
}

export async function getEnrolledFaces() {
  const now = Date.now();
  if (cachedFaces && now - cachedAt < cacheLifetimeMs) return cachedFaces;
  if (loadingFaces) return loadingFaces;

  loadingFaces = (async () => {
    const result = await admin()
      .from('teachers')
      .select('id,full_name,face_descriptor')
      .eq('status', 'active');
    if (result.error) throw result.error;

    cachedFaces = (result.data || []).filter((teacher) =>
      isFaceDescriptor(teacher.face_descriptor)
    );
    cachedAt = Date.now();
    return cachedFaces;
  })();

  try {
    return await loadingFaces;
  } finally {
    loadingFaces = null;
  }
}
