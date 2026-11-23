import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface CardProps {
  children: ReactNode;
  index?: string;
  dotColor?: string;
  title?: string;
  subtitle?: string;
  headerRight?: ReactNode;
  interactive?: boolean;
  noPadding?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Card({
  children,
  index,
  dotColor = 'var(--accent)',
  title,
  subtitle,
  headerRight,
  interactive = false,
  noPadding = false,
  className,
  onClick,
}: CardProps) {
  const hasHeader = Boolean(index || title || headerRight);

  return (
    <div
      onClick={onClick}
      className={cn(
        'sigmat-card rounded-[4px] overflow-hidden',
        interactive && 'sigmat-card-interactive cursor-pointer',
        className
      )}
    >
      {hasHeader && (
        <div className="flex items-start justify-between gap-3 px-5 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="min-w-0">
            {index && (
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: dotColor }}
                />
                <span className="font-mono-tech text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
                  {index}
                </span>
              </div>
            )}
            {title && (
              <h3 className="text-base font-semibold text-[var(--text-primary)] leading-snug">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerRight && <div className="shrink-0 flex items-center gap-2">{headerRight}</div>}
        </div>
      )}
      <div className={cn(!noPadding && 'p-5')}>{children}</div>
    </div>
  );
}
