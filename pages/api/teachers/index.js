import { admin } from '@/lib/supabaseAdmin';

const requiredFields = ['full_name', 'email', 'phone', 'subject', 'status'];

export default async function handler(req, res) {
  try {
    const db = admin();

    if (req.method === 'GET') {
      const teachers = await db
        .from('teachers')
        .select('id,employee_id,full_name,email,phone,subject,qualification,joining_date,monthly_salary,working_hours,status')
        .order('full_name', { ascending: true });
      if (teachers.error) throw teachers.error;
      return res.status(200).json({ teachers: teachers.data || [] });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

    const teacher = req.body || {};
    const missing = requiredFields.find((field) => String(teacher[field] ?? '').trim() === '');
    if (missing) return res.status(400).json({ error: 'Please complete every required teacher field.' });

    const payload = {
      full_name: String(teacher.full_name).trim(),
      email: String(teacher.email).trim(),
      phone: String(teacher.phone).trim(),
      employee_id: `TCH-${crypto.randomUUID()}`,
      subject: String(teacher.subject).trim(),
      monthly_salary: teacher.monthly_salary === null || teacher.monthly_salary === '' || teacher.monthly_salary === undefined
        ? 0
        : Number(teacher.monthly_salary),
      status: teacher.status,
    };
    if (!Number.isFinite(payload.monthly_salary) || payload.monthly_salary < 0) {
      return res.status(400).json({ error: 'Enter a valid monthly salary.' });
    }

    const saved = await db.from('teachers').insert(payload).select('id').single();
    if (saved.error) throw saved.error;
    return res.status(201).json({ id: saved.data.id });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to save the teacher.' });
  }
}
