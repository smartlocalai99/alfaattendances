import {
  Users,
  UserCheck,
  UserX,
  CheckCircle2,
} from 'lucide-react';

const icons = {
  active: Users,
  present: UserCheck,
  absent: UserX,
  completed: CheckCircle2,
};

export default function StatCard({
  type = 'active',
  label,
  value,
  description,
  footer,
}) {
  const Icon = icons[type] || Users;

  const backgrounds = {
    active: 'bg-[#172033]',
    present: 'bg-[#079669]',
    absent: 'bg-[#ff2451]',
    completed: 'bg-[#2f63d9]',
  };

  return (
    <div
      className={`relative min-h-[132px] overflow-hidden rounded-[20px] p-4 text-white shadow-sm ${backgrounds[type]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium text-white/90">
            {label}
          </p>

          <h3 className="mt-1 text-3xl font-bold leading-none">
            {value}
          </h3>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
          <Icon
            size={20}
            strokeWidth={2}
            className="text-white"
          />
        </div>
      </div>

      <div className="absolute bottom-4 left-4">
        <p className="text-[10px] font-medium text-white/90">
          {description}
        </p>

        {footer && (
          <p className="text-[10px] text-white/70">
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}