import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';

export default function Complaints() {
  const router = useRouter();

  const [teachers, setTeachers] = useState([]);
  const [complaints, setComplaints] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [complaint, setComplaint] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError('');

      const [teachersResponse, complaintsResponse] = await Promise.all([
        fetch('/api/teachers'),
        fetch('/api/complaints'),
      ]);

      const teachersData = await teachersResponse.json();
      const complaintsData = await complaintsResponse.json();

      if (!teachersResponse.ok) {
        throw new Error(
          teachersData.error || 'Unable to load teachers.'
        );
      }

      if (!complaintsResponse.ok) {
        throw new Error(
          complaintsData.error || 'Unable to load complaints.'
        );
      }

      setTeachers(teachersData.teachers || []);
      setComplaints(complaintsData.complaints || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to load complaints.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!teacherName) {
      setError('Please select a teacher.');
      return;
    }

    if (!complaint.trim()) {
      setError('Please enter a complaint.');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacher_name: teacherName,
          complaint: complaint.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Unable to raise complaint.'
        );
      }

      setComplaints((previous) => [
        data.complaint,
        ...previous,
      ]);

      setTeacherName('');
      setComplaint('');
      setShowForm(false);
      setSuccess('Complaint raised successfully.');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to raise complaint.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleRaiseComplaint() {
    setShowForm((previous) => !previous);
    setError('');
    setSuccess('');
  }

  return (
    <Layout
      title={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-700 transition hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <span>Complaints</span>
        </div>
      }
    >
      <div className="min-h-full w-full bg-slate-50 px-4 py-3">

        {/* Error */}
        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            {success}
          </div>
        )}

        {/* Complaints Card */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="px-3 py-3">
            <h2 className="text-[11px] font-bold text-slate-800">
              Complaints
            </h2>

            <p className="mt-1 text-[9px] text-slate-500">
              View and manage teacher complaints.
            </p>
          </div>

          <div className="border-t border-slate-100">

            {loading ? (
              <div className="px-3 py-6 text-center text-[10px] text-slate-500">
                Loading complaints...
              </div>
            ) : complaints.length === 0 ? (
              <div className="px-3 py-6 text-center text-[10px] text-slate-500">
                No complaints found.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {complaints.map((item) => (
                  <div
                    key={item.id}
                    className="px-3 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">

                      <p className="text-[10px] font-semibold text-slate-800">
                        {item.teacher_name}
                      </p>

                      <p className="text-[8px] text-slate-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>

                    </div>

                    <p className="mt-1 text-[10px] leading-4 text-slate-600">
                      {item.complaint}
                    </p>

                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* Raise Complaint Button */}
        <div className="mt-2">
          <button
            type="button"
            onClick={handleRaiseComplaint}
            className="rounded-sm bg-blue-600 px-3 py-1.5 text-[10px] font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            {showForm ? 'Close' : 'Raise a Complaint'}
          </button>
        </div>

        {/* Raise Complaint Form */}
        {showForm && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">

            <h2 className="text-[11px] font-bold text-slate-800">
              Raise a Complaint
            </h2>

            <form
              onSubmit={handleSubmit}
              className="mt-3 space-y-3"
            >

              {/* Select Teacher */}
              <div>
                <label className="mb-1 block text-[10px] font-medium text-slate-700">
                  Select Teacher
                </label>

                <select
                  value={teacherName}
                  onChange={(event) =>
                    setTeacherName(event.target.value)
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="">
                    Select teacher
                  </option>

                  {teachers.map((teacher) => (
                    <option
                      key={teacher.id}
                      value={teacher.full_name}
                    >
                      {teacher.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Complaint */}
              <div>
                <label className="mb-1 block text-[10px] font-medium text-slate-700">
                  Complaint
                </label>

                <textarea
                  value={complaint}
                  onChange={(event) =>
                    setComplaint(event.target.value)
                  }
                  rows={4}
                  placeholder="Enter complaint..."
                  className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="rounded-sm bg-blue-600 px-3 py-1.5 text-[10px] font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? 'Submitting...'
                  : 'Submit Complaint'}
              </button>

            </form>
          </div>
        )}

      </div>
    </Layout>
  );
}