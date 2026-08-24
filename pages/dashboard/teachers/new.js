import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import TeacherForm from '@/components/TeacherForm';

const requiredFields = [
  'full_name',
  'email',
  'phone',
  'subject',
  'qualification',
  'joining_date',
  'monthly_salary',
  'working_hours',
  'status',
];

export default function NewTeacher() {
  const router = useRouter();
  const [error, setError] = useState('');

  async function save(form) {
    setError('');

    const missing = requiredFields.find(
      (k) => String(form[k] ?? '').trim() === ''
    );

    if (missing) {
      setError(
        'Please complete every required teacher field before saving.'
      );
      return;
    }

    const teacher = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      subject: form.subject.trim(),
      qualification: form.qualification.trim(),
      joining_date: form.joining_date,
      monthly_salary: Number(form.monthly_salary),
      working_hours: Number(form.working_hours),
      status: form.status,
    };

    if (
      !Number.isFinite(teacher.monthly_salary) ||
      teacher.monthly_salary < 0 ||
      !Number.isFinite(teacher.working_hours) ||
      teacher.working_hours <= 0
    ) {
      setError(
        'Enter a valid monthly salary and working hours.'
      );
      return;
    }

    try {
      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teacher),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || 'Unable to save the teacher.'
        );
        return;
      }

      await router.push(
        `/dashboard/teachers/${data.id}`
      );
    } catch {
      setError(
        'Unable to save the teacher. Please check your connection and try again.'
      );
    }
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

          <span>Enroll Teacher</span>
        </div>
      }
      description="Add a new teacher and face ID"
      backHref={null}
    >
      <div className="card mx-auto max-w-3xl p-6">
        <p className="mt-0 text-sm text-slate-500">
          Create the teacher record first, then enroll their face from the profile.
        </p>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <TeacherForm
          onSubmit={save}
          submitText="Save Teacher"
        />
      </div>
    </Layout>
  );
}