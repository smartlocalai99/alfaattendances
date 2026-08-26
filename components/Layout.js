import Link from 'next/link';
import { useRouter } from 'next/router';
import { Clock3, LayoutDashboard, NotebookPen } from 'lucide-react';

const tabs = [['/dashboard', 'DASHBOARD', LayoutDashboard], ['/in/out', 'IN / OUT', Clock3], ['/payroll', 'PAYROLL', NotebookPen]];

export default function Layout({ children, title, action }) {
  const router = useRouter();
  return <div className="min-h-screen overflow-x-hidden"><aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-6 md:block"><div className="mb-10 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-700 font-bold text-white">TA</div><div><b>TeachTrack</b><p className="m-0 text-xs text-slate-500">Attendance system</p></div></div><nav className="space-y-2">{tabs.map(([href, label, Icon]) => <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${router.pathname.startsWith(href) ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-50'}`}><Icon size={19}/>{label}</Link>)}</nav></aside><main className="min-w-0 pb-24 md:ml-64 md:pb-8"><header className="app-header flex min-h-20 items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-8"><div><h1 className="m-0 text-xl font-bold">{title}</h1></div>{action}</header><div className="mx-auto min-w-0 p-4 sm:p-8">{children}</div></main><nav className="app-bottom-nav fixed inset-x-0 bottom-0 z-20 flex border-t border-slate-200 bg-white md:hidden">{tabs.map(([href, label, Icon]) => <Link key={href} href={href} className={`flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold ${router.pathname.startsWith(href) ? 'text-emerald-700' : 'text-slate-500'}`}><Icon size={19}/>{label}</Link>)}</nav></div>;
}
