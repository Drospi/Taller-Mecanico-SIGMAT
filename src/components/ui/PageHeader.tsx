import type { ReactNode } from 'react';

export interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[var(--border-subtle)]">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0" />
          <span className="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            {eyebrow}
          </span>
          <span className="hidden sm:inline-block h-px w-10 bg-[var(--border-strong)]" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[var(--text-secondary)] mt-1.5 max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
