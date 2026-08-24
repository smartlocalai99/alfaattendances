import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import { requireSupabase } from '@/lib/supabaseClient';
import { calculatePayroll, money } from '@/lib/payroll';

export default function Notes() {
  const [teachers, setTeachers] = useState([]);
  const [id, setId] = useState('');
  const [notes, setNotes] = useState([]);
  const [note, setNote] = useState('');

  const [month, setMonth] = useState(
    new Date().getMonth() + 1
  );

  const [year, setYear] = useState(
    new Date().getFullYear()
  );

  const [summary, setSummary] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [teacherError, setTeacherError] = useState('');

  /* =========================================
     GET TEACHERS FROM SUPABASE
  ========================================= */

  useEffect(() => {
    loadTeachers();
  }, []);


async function loadTeachers() {
  setLoadingTeachers(true);
  setTeacherError('');

  try {
    const supabase = requireSupabase();

    const { data, error } = await supabase
      .from('teachers')
      .select(`
        id,
        employee_id,
        full_name,
        email,
        phone,
        subject,
        qualification,
        joining_date,
        monthly_salary,
        working_hours,
        status
      `)
      .order('full_name', {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    console.log('Teachers from Supabase:', data);

    setTeachers(data || []);
  } catch (error) {
    console.error('Error loading teachers:', error);

    setTeachers([]);

    setTeacherError(
      error?.message ||
        'Unable to load teachers from Supabase.'
    );
  } finally {
    setLoadingTeachers(false);
  }
}

  /* =========================================
     SELECTED TEACHER
  ========================================= */

  const teacher = useMemo(() => {
    return teachers.find(
      (item) => String(item.id) === String(id)
    );
  }, [teachers, id]);

  /* =========================================
     LOAD NOTES WHEN TEACHER CHANGES
  ========================================= */

  useEffect(() => {
    if (id) {
      loadNotes();
    } else {
      setNotes([]);
      setNote('');
    }
  }, [id]);

  async function loadNotes() {
    try {
      const supabase = requireSupabase();

      const { data, error } = await supabase
        .from('teacher_notes')
        .select('*')
        .eq('teacher_id', id)
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
      alert(error?.message || 'Unable to load notes.');
    }
  }

  /* =========================================
     ADD TEACHER NOTE
  ========================================= */

  async function addNote() {
    if (!id) {
      alert('Please select a teacher first.');
      return;
    }

    if (!note.trim()) {
      alert('Please enter a note.');
      return;
    }

    setSaving(true);

    try {
      const supabase = requireSupabase();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('teacher_notes')
        .insert({
          teacher_id: id,
          note: note.trim(),
          created_by: user?.id || null,
        });

      if (error) {
        throw error;
      }

      setNote('');

      await loadNotes();
    } catch (error) {
      console.error('Error adding note:', error);

      alert(
        error?.message ||
          'Unable to save the teacher note.'
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================
     CALCULATE PAYROLL
  ========================================= */

  async function calculate() {
    if (!teacher) {
      alert('Please select a teacher.');
      return;
    }

    const start = `${year}-${String(month).padStart(
      2,
      '0'
    )}-01`;

    const end = new Date(
      Number(year),
      Number(month),
      0
    )
      .toISOString()
      .slice(0, 10);

    try {
      const supabase = requireSupabase();

      const { data, error } = await supabase
        .from('attendance')
        .select('status')
        .eq('teacher_id', id)
        .gte('attendance_date', start)
        .lte('attendance_date', end);

      if (error) {
        throw error;
      }

      const count = (status) =>
        (data || []).filter(
          (entry) => entry.status === status
        ).length;

      setSummary(
        calculatePayroll({
          monthlySalary: teacher.monthly_salary,
          workingDays: 26,
          presentDays: count('present'),
          halfDays: count('half_day'),
          paidLeaveDays: count('paid_leave'),
          unpaidLeaveDays: count('unpaid_leave'),
        })
      );
    } catch (error) {
      console.error(
        'Error calculating payroll:',
        error
      );

      alert(
        error?.message ||
          'Unable to calculate payroll.'
      );
    }
  }

  /* =========================================
     SAVE PAYROLL
  ========================================= */

  async function savePayroll() {
    if (!summary || !teacher) {
      return;
    }

    setSaving(true);

    try {
      const supabase = requireSupabase();

      const { error } = await supabase
        .from('payroll')
        .upsert(
          {
            teacher_id: id,
            month: Number(month),
            year: Number(year),
            monthly_salary: summary.monthlySalary,
            working_days: summary.workingDays,
            present_days: summary.presentDays,
            half_days: summary.halfDays,
            paid_leave_days:
              summary.paidLeaveDays,
            unpaid_leave_days:
              summary.unpaidLeaveDays,
            gross_salary: summary.grossSalary,
            deductions: summary.deductions,
            net_salary: summary.netPay,
            status: 'draft',
          },
          {
            onConflict: 'teacher_id,month,year',
          }
        );

      if (error) {
        throw error;
      }

      alert('Payroll saved as draft.');
    } catch (error) {
      console.error(
        'Error saving payroll:',
        error
      );

      alert(
        error?.message ||
          'Unable to save payroll.'
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================
     TEACHER SELECT
  ========================================= */

  function TeacherSelect({ className = '' }) {
    return (
      <select
        className={`field w-full ${className}`}
        value={id}
        onChange={(event) => {
          setId(event.target.value);
          setSummary(null);
        }}
        disabled={loadingTeachers}
      >
        <option value="">
          {loadingTeachers
            ? 'Loading teachers...'
            : 'Select Teacher'}
        </option>

        {teachers.map((item) => (
          <option
            key={item.id}
            value={item.id}
          >
            {item.full_name}
            {item.employee_id
              ? ` — ${item.employee_id}`
              : ''}
          </option>
        ))}
      </select>
    );
  }

  return (
    <Layout
      title={
        <div className="flex items-center gap-1">
          <Link
            href="/dashboard"
            aria-label="Back to Dashboard"
            className="flex h-7 w-7 items-center justify-center text-slate-800"
          >
            <ArrowLeft
              size={20}
              strokeWidth={2}
            />
          </Link>

          <span>Notes & Payroll</span>
        </div>
      }
      description="Manage teacher notes and monthly payroll"
      backHref={null}
    >
      {/* =========================================
          TEACHER LOAD ERROR
      ========================================= */}

      {teacherError && (
        <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          <b>Unable to load teachers.</b>

          <p className="mb-3 mt-1">
            {teacherError}
          </p>

          <button
            type="button"
            onClick={loadTeachers}
            className="font-bold underline"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">

        {/* =====================================
            TEACHER NOTES
        ====================================== */}

        <section className="card p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="m-0 text-lg font-bold">
              Teacher Notes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add and view notes for a specific
              teacher.
            </p>
          </div>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Select Teacher
          </label>

          <TeacherSelect />

          {id && teacher && (
            <>
              {/* Teacher information */}

              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="m-0 font-bold text-slate-900">
                  {teacher.full_name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {teacher.employee_id || 'No Employee ID'}
                  {teacher.subject
                    ? ` • ${teacher.subject}`
                    : ''}
                </p>
              </div>

              {/* Add Note */}

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Add Note
                </label>

                <textarea
                  className="field min-h-[110px] w-full resize-none"
                  value={note}
                  onChange={(event) =>
                    setNote(event.target.value)
                  }
                  placeholder="Add a note regarding this teacher..."
                />

                <button
                  type="button"
                  onClick={addNote}
                  disabled={
                    saving || !note.trim()
                  }
                  className="btn-primary mt-3 w-full"
                >
                  {saving
                    ? 'Saving...'
                    : 'Add Note'}
                </button>
              </div>

              {/* Previous Notes */}

              <div className="mt-7">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="m-0 text-base font-bold">
                    Previous Notes
                  </h3>

                  <span className="text-xs text-slate-500">
                    {notes.length}{' '}
                    {notes.length === 1
                      ? 'note'
                      : 'notes'}
                  </span>
                </div>

                {notes.length > 0 ? (
                  <div className="space-y-3">
                    {notes.map((entry) => (
                      <article
                        key={entry.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="m-0 text-xs font-semibold text-slate-500">
                            {new Date(
                              entry.created_at
                            ).toLocaleDateString(
                              'en-IN',
                              {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              }
                            )}
                          </p>

                          <span className="text-xs font-medium text-slate-400">
                            Admin
                          </span>
                        </div>

                        <p className="mb-0 mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {entry.note}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center">
                    <p className="m-0 text-sm text-slate-500">
                      No notes added for this
                      teacher yet.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {!id && !loadingTeachers && (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-5 text-center">
              <p className="m-0 text-sm text-slate-500">
                Select a teacher to add or view
                notes.
              </p>
            </div>
          )}
        </section>

        {/* =====================================
            MONTHLY PAYROLL
        ====================================== */}

        <section className="card p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="m-0 text-lg font-bold">
              Monthly Payroll
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Calculate payroll based on
              attendance.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">

            {/* Teacher from DB */}

            <TeacherSelect className="sm:col-span-3" />

            {/* Month */}

            <select
              className="field"
              value={month}
              onChange={(event) => {
                setMonth(event.target.value);
                setSummary(null);
              }}
            >
              {Array.from(
                { length: 12 },
                (_, index) => (
                  <option
                    key={index + 1}
                    value={index + 1}
                  >
                    {new Date(
                      2000,
                      index
                    ).toLocaleString('en', {
                      month: 'long',
                    })}
                  </option>
                )
              )}
            </select>

            {/* Year */}

            <input
              className="field"
              type="number"
              value={year}
              onChange={(event) => {
                setYear(event.target.value);
                setSummary(null);
              }}
            />

            {/* Calculate */}

            <button
              type="button"
              className="btn-primary"
              onClick={calculate}
              disabled={
                !id || loadingTeachers
              }
            >
              Calculate Payroll
            </button>
          </div>

          {/* Payroll Result */}

          {summary && teacher && (
            <div className="mt-6">
              <h3 className="text-lg font-bold">
                Payroll —{' '}
                {new Date(
                  year,
                  month - 1
                ).toLocaleString('en', {
                  month: 'long',
                  year: 'numeric',
                })}
              </h3>

              <p className="text-sm text-slate-600">
                Teacher
                <br />

                <b className="text-slate-900">
                  {teacher.full_name}
                </b>
              </p>

              {[
                [
                  'Monthly Salary',
                  summary.monthlySalary,
                ],
                [
                  'Working Days',
                  summary.workingDays,
                ],
                [
                  'Present',
                  summary.presentDays,
                ],
                [
                  'Half Days',
                  summary.halfDays,
                ],
                [
                  'Paid Leave',
                  summary.paidLeaveDays,
                ],
                [
                  'Absent',
                  summary.unpaidLeaveDays,
                ],
                [
                  'Deductions',
                  summary.deductions,
                ],
                [
                  'Net Pay',
                  summary.netPay,
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between border-b py-2 text-sm"
                >
                  <span>{label}</span>

                  <b>
                    {typeof value === 'number' &&
                    [
                      'Monthly Salary',
                      'Deductions',
                      'Net Pay',
                    ].includes(label)
                      ? money(value)
                      : value}
                  </b>
                </div>
              ))}

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  className="btn-primary flex-1"
                  onClick={savePayroll}
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : 'Save Payroll'}
                </button>

                <button
                  type="button"
                  className="btn-secondary flex-1"
                  onClick={() =>
                    window.print()
                  }
                >
                  Print Payroll
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}