export function calculatePayroll({ monthlySalary, workingDays, presentDays = 0, halfDays = 0, paidLeaveDays = 0, unpaidLeaveDays = 0 }) {
  const salary = Number(monthlySalary || 0);
  const days = Math.max(1, Number(workingDays || 0));
  const dailySalary = salary / days;
  const payable = Number(presentDays) + Number(halfDays) * 0.5 + Number(paidLeaveDays);
  const grossSalary = Math.min(salary, dailySalary * payable);
  return { monthlySalary: salary, workingDays: days, presentDays: Number(presentDays), halfDays: Number(halfDays), paidLeaveDays: Number(paidLeaveDays), unpaidLeaveDays: Number(unpaidLeaveDays), grossSalary, deductions: Math.max(0, salary - grossSalary), netPay: grossSalary };
}

export function durationBetween(inTime, outTime) {
  if (!inTime || !outTime) return '—';
  const minutes = Math.floor((new Date(outTime) - new Date(inTime)) / 60000);
  return minutes < 0 ? '—' : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0));
