import { admin } from '@/lib/supabaseAdmin';

const fields = ['teacher_id', 'month', 'year', 'monthly_salary', 'working_days', 'present_days', 'half_days', 'paid_leave_days', 'unpaid_leave_days', 'gross_salary', 'deductions', 'net_salary', 'status'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  try {
    const payroll = Object.fromEntries(fields.map((field) => [field, req.body?.[field]]));
    if (!payroll.teacher_id || !payroll.month || !payroll.year) return res.status(400).json({ error: 'Teacher, month, and year are required.' });
    const saved = await admin().from('payroll').upsert(payroll, { onConflict: 'teacher_id,month,year' }).select('id').single();
    if (saved.error) throw saved.error;
    return res.status(200).json({ id: saved.data.id });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to save payroll.' });
  }
}
