import { admin } from '@/lib/supabaseAdmin';

const numericFields = [
  'month',
  'year',
  'monthly_salary',
  'working_days',
  'present_days',
  'half_days',
  'paid_leave_days',
  'unpaid_leave_days',
  'gross_salary',
  'deductions',
  'net_salary',
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  try {
    const body = req.body || {};

    const teacher_id = body.teacher_id;
    const month = Number(body.month);
    const year = Number(body.year);

    if (!teacher_id || !month || !year) {
      return res.status(400).json({
        error: 'Teacher, month, and year are required.',
      });
    }

    const payroll = {
      teacher_id,
      month,
      year,

      monthly_salary: Number(body.monthly_salary || 0),
      working_days: Number(body.working_days || 26),
      present_days: Number(body.present_days || 0),
      half_days: Number(body.half_days || 0),
      paid_leave_days: Number(body.paid_leave_days || 0),
      unpaid_leave_days: Number(body.unpaid_leave_days || 0),

      gross_salary: Number(body.gross_salary || 0),
      deductions: Number(body.deductions || 0),
      net_salary: Number(body.net_salary || 0),

      status: body.status || 'generated',

      updated_at: new Date().toISOString(),
    };

    const { data, error } = await admin()
      .from('payroll')
      .upsert(payroll, {
        onConflict: 'teacher_id,month,year',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Payroll save error:', error);

      return res.status(500).json({
        error: error.message || 'Unable to save payroll.',
      });
    }

    return res.status(200).json({
      success: true,
      id: data.id,
    });
  } catch (error) {
    console.error('Payroll API error:', error);

    return res.status(500).json({
      error: error.message || 'Unable to save payroll.',
    });
  }
}