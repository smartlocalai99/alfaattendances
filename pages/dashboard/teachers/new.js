import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import TeacherForm from '@/components/TeacherForm';

export default function NewTeacher() {
  const router = useRouter();
  const [error, setError] = useState('');

  async function save(form) {
    setError('');

    const teacher = {
      full_name: String(form.full_name || '').trim(),
      phone: String(form.phone || '').trim(),
      monthly_salary: form.monthly_salary == null || form.monthly_salary === '' ? 0 : Number(form.monthly_salary),
      status: form.status || 'active',
    };

    if (
      !Number.isFinite(teacher.monthly_salary) || teacher.monthly_salary < 0
    ) {
      setError('Enter a valid monthly salary.');
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

      router.replace('/dashboard?added=1');
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

          <span>Add Teacher</span>
        </div>
      }
      description="Add teacher details. Face enrollment can be done later from the teachers list."
      backHref={null}
    >
      <div className="card mx-auto max-w-3xl p-6">
        <p className="mt-0 text-sm text-slate-500">
          Add the teacher details now. You can enroll their face later from the teachers list.
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
