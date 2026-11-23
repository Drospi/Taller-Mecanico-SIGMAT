import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToastStore } from '../../store';
import { cn } from '../../utils/cn';

const ICON_MAP = {
  success: <CheckCircle2 className="w-4 h-4 text-[var(--status-ok)] shrink-0 mt-0.5" />,
  error: <XCircle className="w-4 h-4 text-[var(--status-danger)] shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />,
  info: <Info className="w-4 h-4 text-[var(--status-info)] shrink-0 mt-0.5" />,
};

const BORDER_MAP = {
  success: 'border-l-[var(--status-ok)]',
  error: 'border-l-[var(--status-danger)]',
  warning: 'border-l-[var(--accent)]',
  info: 'border-l-[var(--status-info)]',
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2.5 w-[calc(100vw-2rem)] max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto rounded-[4px] border border-[var(--border-strong)] border-l-[3px] bg-[var(--bg-surface)] px-4 py-3 shadow-2xl flex items-start gap-3',
            BORDER_MAP[toast.variant]
          )}
        >
          {ICON_MAP[toast.variant]}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug">
              {toast.title}
            </p>
            {toast.description && (
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                {toast.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            aria-label="Cerrar notificación"
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
