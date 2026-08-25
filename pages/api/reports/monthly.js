import ExcelJS from 'exceljs';
import { admin } from '@/lib/supabaseAdmin';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function workingDays(from, to) {
  let total = 0;
  const day = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  while (day <= end) {
    const weekDay = day.getUTCDay();
    if (weekDay !== 0 && weekDay !== 6) total += 1;
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return total;
}

function percentage(present, possible) {
  return possible ? Number(((present / possible) * 100).toFixed(1)) : 0;
}

async function createReport(month, year) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const monthEnd = dateKey(new Date(Date.UTC(year, month, 0)));
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.SCHOOL_TIMEZONE || 'Asia/Kolkata',
  }).format(new Date());
  const end = start > today ? start : (monthEnd > today ? today : monthEnd);
  const totalWorkingDays = start > today ? 0 : workingDays(start, end);
  const db = admin();
  const [teachersResult, attendanceResult] = await Promise.all([
    db.from('teachers').select('id,full_name,phone').eq('status', 'active').order('full_name'),
    start > today
      ? Promise.resolve({ data: [], error: null })
      : db.from('attendance').select('teacher_id,attendance_date,in_time,status').gte('attendance_date', start).lte('attendance_date', end),
  ]);
  if (teachersResult.error) throw teachersResult.error;
  if (attendanceResult.error) throw attendanceResult.error;

  const teacherIds = new Set((teachersResult.data || []).map((teacher) => teacher.id));
  const presentDays = new Map();
  for (const record of attendanceResult.data || []) {
    if (!teacherIds.has(record.teacher_id) || !record.attendance_date) continue;
    // A Set prevents duplicate rows for the same teacher on the same day being counted twice.
    const key = `${record.teacher_id}:${record.attendance_date}`;
    presentDays.set(key, true);
  }

  const teachers = (teachersResult.data || []).map((teacher) => {
    let present = 0;
    for (let day = new Date(`${start}T00:00:00.000Z`); day <= new Date(`${end}T00:00:00.000Z`); day.setUTCDate(day.getUTCDate() + 1)) {
      const weekDay = day.getUTCDay();
      if (weekDay !== 0 && weekDay !== 6 && presentDays.has(`${teacher.id}:${dateKey(day)}`)) present += 1;
    }
    const absent = Math.max(0, totalWorkingDays - present);
    return {
      name: teacher.full_name,
      mobileNumber: teacher.phone || '',
      present,
      absent,
      attendancePercentage: percentage(present, totalWorkingDays),
    };
  });

  const totalPresent = teachers.reduce((sum, teacher) => sum + teacher.present, 0);
  const totalAbsent = teachers.reduce((sum, teacher) => sum + teacher.absent, 0);
  return {
    schoolName: process.env.SCHOOL_NAME || 'Teacher Attendance',
    period: `${MONTHS[month - 1]} ${year}`,
    month,
    year,
    summary: {
      totalTeachers: teachers.length,
      totalWorkingDays,
      totalPresent,
      totalAbsent,
      attendancePercentage: percentage(totalPresent, teachers.length * totalWorkingDays),
    },
    teachers,
  };
}

async function excelReport(report) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Monthly Attendance');
  sheet.columns = [
    { header: 'Teacher Name', key: 'name', width: 28 },
    { header: 'Mobile Number', key: 'mobileNumber', width: 20 },
    { header: 'Present Days', key: 'present', width: 16 },
    { header: 'Absent Days', key: 'absent', width: 16 },
    { header: 'Attendance Percentage', key: 'attendancePercentage', width: 24 },
  ];
  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value = report.schoolName;
  sheet.getCell('A1').font = { bold: true, size: 16 };
  sheet.mergeCells('A2:F2');
  sheet.getCell('A2').value = `Monthly Attendance Report — ${report.period}`;
  sheet.getCell('A2').font = { bold: true, size: 12 };
  sheet.addRow([]);
  sheet.addRow(['Total Teachers', report.summary.totalTeachers]);
  sheet.addRow(['Total Working Days', report.summary.totalWorkingDays]);
  sheet.addRow(['Total Present', report.summary.totalPresent]);
  sheet.addRow(['Total Absent', report.summary.totalAbsent]);
  sheet.addRow(['Attendance Percentage', `${report.summary.attendancePercentage}%`]);
  sheet.addRow([]);
  const headerRow = sheet.addRow(['Teacher Name', 'Mobile Number', 'Present Days', 'Absent Days', 'Attendance Percentage']);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF167A62' } };
  report.teachers.forEach((teacher) => {
    sheet.addRow({ ...teacher, attendancePercentage: `${teacher.attendancePercentage}%` });
  });
  sheet.views = [{ state: 'frozen', ySplit: 10 }];
  return workbook.xlsx.writeBuffer();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
  const month = Number(req.query.month);
  const year = Number(req.query.year);
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000 || year > 2100) {
    return res.status(400).json({ error: 'Choose a valid month and year.' });
  }
  try {
    const report = await createReport(month, year);
    if (req.query.download !== 'excel') return res.status(200).json(report);

    const file = await excelReport(report);
    const fileName = `monthly-attendance-${year}-${String(month).padStart(2, '0')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.status(200).send(Buffer.from(file));
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to create the monthly report.' });
  }
}
