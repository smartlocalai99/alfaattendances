import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PageHeader({ title, description, backHref }) {
  return (
    <div className="mx-auto flex max-w-2xl items-center gap-3">
      {backHref && (
        <Link
          href={backHref}
          aria-label="Go back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </Link>
      )}
      <div>
        <h1 className="m-0 text-xl font-bold">{title}</h1>
        {description && (
          <p className="mb-0 mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
    </div>
  );
}
