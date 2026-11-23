import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export type BadgeTone = 'neutral' | 'accent' | 'ok' | 'warn' | 'danger' | 'info';

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  pill?: boolean;
  className?: string;
}

const TONE_MAP: Record<BadgeTone, string> = {
  neutral: 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
  accent: 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent-border)]',
  ok: 'bg-[var(--status-ok-soft)] text-[var(--status-ok)] border-[var(--status-ok)]/30',
  warn: 'bg-[var(--status-warn-soft)] text-[var(--status-warn)] border-[var(--status-warn)]/35',
  danger: 'bg-[var(--status-danger-soft)] text-[var(--status-danger)] border-[var(--status-danger)]/35',
  info: 'bg-[var(--status-info-soft)] text-[var(--status-info)] border-[var(--status-info)]/35',
};

const DOT_MAP: Record<BadgeTone, string> = {
  neutral: 'bg-[var(--status-neutral)]',
  accent: 'bg-[var(--accent)]',
  ok: 'bg-[var(--status-ok)]',
  warn: 'bg-[var(--status-warn)]',
  danger: 'bg-[var(--status-danger)]',
  info: 'bg-[var(--status-info)]',
};

export function Badge({
  children,
  tone = 'neutral',
  dot = false,
  pill = true,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border px-2.5 py-0.5 text-[11px] font-mono-tech uppercase tracking-wider font-medium leading-5',
        pill ? 'rounded-full' : 'rounded-[3px]',
        TONE_MAP[tone],
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', DOT_MAP[tone])} />}
      {children}
    </span>
  );
}
