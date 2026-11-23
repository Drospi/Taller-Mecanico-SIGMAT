import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface StatCardProps {
  index: string;
  label: string;
  value: string | number;
  helper?: string;
  dotColor?: string;
  icon?: ReactNode;
  onClick?: () => void;
}

export function StatCard({
  index,
  label,
  value,
  helper,
  dotColor = 'var(--accent)',
  icon,
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'sigmat-card rounded-[4px] p-4 flex flex-col justify-between gap-3',
        onClick && 'sigmat-card-interactive cursor-pointer'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
          <span className="font-mono-tech text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
            {index}
          </span>
        </div>
        {icon && <div className="text-[var(--text-muted)]">{icon}</div>}
      </div>

      <div>
        <div className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight leading-none">
          {value}
        </div>
        <div className="mt-2 font-mono-tech text-[11px] uppercase tracking-wider text-[var(--text-secondary)]">
          {label}
        </div>
        {helper && (
          <div className="mt-1 text-xs text-[var(--text-muted)]">{helper}</div>
        )}
      </div>
    </div>
  );
}
