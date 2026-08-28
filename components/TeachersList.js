




// import { useState } from 'react';
// import FaceEnrollmentModal from '@/components/FaceEnrollmentModal';

// export default function TeachersList({ teachers, onTeacherUpdated }) {
//   const [selectedTeacher, setSelectedTeacher] = useState(null);

//   return (
//     <>
//       <div className="w-full overflow-hidden">
//         <table className="w-full !min-w-0 table-fixed">
//           <thead>
//             <tr className="border-b border-slate-200">
//               <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">
//                 Teacher Name
//               </th>
//               <th className="w-[132px] px-3 py-3 text-left text-xs font-semibold text-slate-500">
//                 Enroll Face
//               </th>
//             </tr>
//           </thead>

//           <tbody>
//             {teachers?.length > 0 ? (
//               teachers.map((teacher) => (
//                 <tr
//                   key={teacher.id}
//                   className="border-b border-slate-100 last:border-b-0"
//                 >
//                   <td className="px-3 py-3">
//                     <span className="block break-words text-sm font-semibold text-slate-800">
//                       {teacher.full_name || 'Unnamed teacher'}
//                     </span>
//                   </td>
//                   <td className="px-3 py-3">
//                     <button
//                       type="button"
//                       onClick={() => setSelectedTeacher(teacher)}
//                       className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
//                     >
//                       {teacher.face_enrolled ? 'Update Face' : 'Enroll Face'}
//                     </button>
//                   </td>
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td
//                   colSpan={2}
//                   className="py-8 text-center text-sm text-slate-500"
//                 >
//                   No teachers found.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {selectedTeacher && (
//         <FaceEnrollmentModal
//           key={selectedTeacher.id}
//           teacherId={selectedTeacher.id}
//           teacherName={selectedTeacher.full_name}
//           onSaved={onTeacherUpdated}
//           onComplete={() => setSelectedTeacher(null)}
//         />
//       )}
//     </>
//   );
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
                Face
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
                  {/* Teacher Name */}
                  <td className="px-3 py-3">
                    <span className="block break-words text-sm font-semibold text-slate-800">
                      {teacher.full_name || 'Unnamed teacher'}
                    </span>
                  </td>

                  {/* Face Enrollment */}
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        // Only allow enrollment if face is not enrolled
                        if (!teacher.face_enrolled) {
                          setSelectedTeacher(teacher);
                        }
                      }}
                      disabled={teacher.face_enrolled}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                        teacher.face_enrolled
                          ? 'cursor-default bg-emerald-100 text-emerald-700'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {teacher.face_enrolled
                        ? 'Enrolled Face'
                        : 'Enroll Face'}
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

      {/* Face Enrollment Modal */}
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
