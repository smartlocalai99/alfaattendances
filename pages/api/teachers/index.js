import { admin } from '@/lib/supabaseAdmin';

const requiredFields = ['full_name', 'email', 'phone', 'employee_id', 'subject', 'qualification', 'joining_date', 'monthly_salary', 'working_hours', 'status'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  try {
    const teacher = req.body || {};
    const missing = requiredFields.find((field) => String(teacher[field] ?? '').trim() === '');
    if (missing) return res.status(400).json({ error: 'Please complete every required teacher field.' });

    const payload = {
      full_name: String(teacher.full_name).trim(),
      email: String(teacher.email).trim(),
      phone: String(teacher.phone).trim(),
      employee_id: String(teacher.employee_id).trim(),
      subject: String(teacher.subject).trim(),
      qualification: String(teacher.qualification).trim(),
      joining_date: teacher.joining_date,
      monthly_salary: Number(teacher.monthly_salary),
      working_hours: Number(teacher.working_hours),
      status: teacher.status,
    };
    if (!Number.isFinite(payload.monthly_salary) || payload.monthly_salary < 0 || !Number.isFinite(payload.working_hours) || payload.working_hours <= 0) {
      return res.status(400).json({ error: 'Enter a valid monthly salary and working hours.' });
    }

    const db = admin();
    const duplicate = await db.from('teachers').select('id').eq('employee_id', payload.employee_id).maybeSingle();
    if (duplicate.error) throw duplicate.error;
    if (duplicate.data) return res.status(409).json({ error: 'A teacher with this Employee ID already exists.' });

    const saved = await db.from('teachers').insert(payload).select('id').single();
    if (saved.error) throw saved.error;
    return res.status(201).json({ id: saved.data.id });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to save the teacher.' });
  }
}
