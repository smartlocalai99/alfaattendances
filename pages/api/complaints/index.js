import { admin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  try {
    const db = admin();

    // GET complaints
    if (req.method === 'GET') {
      const { data, error } = await db
        .from('complaints')
        .select('id, teacher_name, complaint, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('GET complaints error:', error);
        return res.status(500).json({
          error: error.message || 'Unable to load complaints.',
        });
      }

      return res.status(200).json({
        complaints: data || [],
      });
    }

    // POST complaint
    if (req.method === 'POST') {
      const teacherName = String(
        req.body?.teacher_name || ''
      ).trim();

      const complaint = String(
        req.body?.complaint || ''
      ).trim();

      if (!teacherName) {
        return res.status(400).json({
          error: 'Please select a teacher.',
        });
      }

      if (!complaint) {
        return res.status(400).json({
          error: 'Enter a complaint.',
        });
      }

      const { data, error } = await db
        .from('complaints')
        .insert({
          teacher_name: teacherName,
          complaint,
        })
        .select('id, teacher_name, complaint, created_at')
        .single();

      if (error) {
        console.error('POST complaint error:', error);
        return res.status(500).json({
          error: error.message || 'Unable to raise complaint.',
        });
      }

      return res.status(201).json({
        complaint: data,
      });
    }

    return res.status(405).json({
      error: 'Method not allowed.',
    });
  } catch (error) {
    console.error('Complaints API error:', error);

    return res.status(500).json({
      error: error.message || 'Unable to manage complaints.',
    });
  }
}