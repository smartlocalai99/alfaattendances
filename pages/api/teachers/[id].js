import { admin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
  try {
    const { id } = req.query;
    const result = await admin().from('teachers').select('*,attendance(*)').eq('id', id).single();
    if (result.error) {
      if (result.error.code === 'PGRST116') return res.status(404).json({ error: 'Teacher not found.' });
      throw result.error;
    }
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to load the teacher.' });
  }
}
