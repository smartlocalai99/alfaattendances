// import { useState } from 'react';
// import FaceEnrollmentModal from '@/components/FaceEnrollmentModal';

// export default function TeachersList({ teachers, onTeacherUpdated }) {
//   const [selectedTeacher, setSelectedTeacher] = useState(null);

//   return <>
//     <div className="w-full overflow-hidden">
//       <table className="w-full min-w-0 table-fixed">
//         <thead><tr><th className="w-1/2">Teacher Name</th><th className="w-1/2">Enroll Face</th></tr></thead>
//         <tbody>{teachers.length ? teachers.map((teacher) => <tr key={teacher.id}>
//           <td className="break-words"><b>{teacher.full_name || 'Unnamed teacher'}</b></td>
//           <td><button type="button" className={teacher.face_enrolled ? 'btn-secondary whitespace-nowrap' : 'btn-primary whitespace-nowrap bg-emerald-600 hover:bg-emerald-700'} onClick={() => setSelectedTeacher(teacher)}>{teacher.face_enrolled ? 'Update Face' : 'Enroll Face'}</button></td>
//         </tr>) : <tr><td colSpan={2} className="py-8 text-center text-slate-500">No teachers found.</td></tr>}</tbody>
//       </table>
//     </div>
//     {selectedTeacher && <FaceEnrollmentModal key={selectedTeacher.id} teacherId={selectedTeacher.id} teacherName={selectedTeacher.full_name} onSaved={onTeacherUpdated} onComplete={() => setSelectedTeacher(null)} />}
//   </>;
// }






import { useState } from 'react';
import FaceEnrollmentModal from '@/components/FaceEnrollmentModal';

export default function TeachersList({ teachers, onTeacherUpdated }) {
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  return (
    <>
      <div className="w-full overflow-hidden">
        <table className="w-full !min-w-0 table-fixed">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">
                Teacher Name
              </th>
              <th className="w-[132px] px-3 py-3 text-left text-xs font-semibold text-slate-500">
                Enroll Face
              </th>
            </tr>
          </thead>

          <tbody>
            {teachers?.length > 0 ? (
              teachers.map((teacher) => (
                <tr
                  key={teacher.id}
                  className="border-b border-slate-100 last:border-b-0"
                >
                  <td className="px-3 py-3">
                    <span className="block break-words text-sm font-semibold text-slate-800">
                      {teacher.full_name || 'Unnamed teacher'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => setSelectedTeacher(teacher)}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      {teacher.face_enrolled ? 'Update Face' : 'Enroll Face'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={2}
                  className="py-8 text-center text-sm text-slate-500"
                >
                  No teachers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedTeacher && (
        <FaceEnrollmentModal
          key={selectedTeacher.id}
          teacherId={selectedTeacher.id}
          teacherName={selectedTeacher.full_name}
          onSaved={onTeacherUpdated}
          onComplete={() => setSelectedTeacher(null)}
        />
      )}
    </>
  );
}
