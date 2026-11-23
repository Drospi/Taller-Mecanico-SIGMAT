import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 border border-dashed border-[var(--border-strong)] rounded-[4px] bg-[var(--bg-elevated)]/30">
      <div className="w-11 h-11 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-center mb-3">
        <Inbox className="w-5 h-5 text-[var(--accent)]" />
      </div>
      <h4 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h4>
      <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-md">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
