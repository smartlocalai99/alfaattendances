import { admin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  try {
    const db = admin();

    if (req.method === 'GET') {
      const teacherId = String(req.query.teacherId || '');
      if (!teacherId) return res.status(400).json({ error: 'Teacher is required.' });
      const notes = await db
        .from('teacher_notes')
        .select('id,teacher_id,note,created_at,updated_at')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });
      if (notes.error) throw notes.error;
      return res.status(200).json({ notes: notes.data || [] });
    }

    if (req.method === 'POST') {
      const teacherId = String(req.body?.teacher_id || '');
      const note = String(req.body?.note || '').trim();
      if (!teacherId || !note) return res.status(400).json({ error: 'Teacher and note are required.' });
      const saved = await db
        .from('teacher_notes')
        .insert({ teacher_id: teacherId, note })
        .select('id,teacher_id,note,created_at,updated_at')
        .single();
      if (saved.error) throw saved.error;
      return res.status(201).json({ note: saved.data });
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to manage teacher notes.' });
  }
}
