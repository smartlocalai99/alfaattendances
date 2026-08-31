export function calculatePayroll({ monthlySalary, workingDays, presentDays = 0, halfDays = 0, paidLeaveDays = 0, unpaidLeaveDays = 0 }) {
  const salary = Number(monthlySalary || 0);
  const days = Math.max(1, Number(workingDays || 0));
  const dailySalary = salary / days;
  const payable = Number(presentDays) + Number(halfDays) * 0.5 + Number(paidLeaveDays);
  const grossSalary = Math.min(salary, dailySalary * payable);
  return { monthlySalary: salary, workingDays: days, presentDays: Number(presentDays), halfDays: Number(halfDays), paidLeaveDays: Number(paidLeaveDays), unpaidLeaveDays: Number(unpaidLeaveDays), grossSalary, deductions: Math.max(0, salary - grossSalary), netPay: grossSalary };
}

function getIndiaDate(timestamp) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(timestamp));

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export function calculatePresentDays(
  attendanceRecords,
  startDate,
  endDate
) {
  const attendanceByDate = new Map();

  attendanceRecords.forEach((record) => {
    if (!record.in_time) return;

    const date = getIndiaDate(record.in_time);

    if (date < startDate || date > endDate) return;

    attendanceByDate.set(
      date,
      (attendanceByDate.get(date) || 0) + 1
    );
  });

  return Array.from(attendanceByDate.values()).reduce(
    (total, sessionCount) =>
      total + Math.min(sessionCount * 0.5, 1),
    0
  );
}

export function durationBetween(inTime, outTime) {
  if (!inTime || !outTime) return '—';
  const minutes = Math.floor((new Date(outTime) - new Date(inTime)) / 60000);
  return minutes < 0 ? '—' : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0));
