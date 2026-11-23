import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

const BASE_FIELD_CLASS =
  'w-full rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--accent)] focus:outline-none disabled:opacity-60';

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function FormInput({ label, error, hint, className, id, ...props }: FormInputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="font-mono-tech text-[11px] uppercase tracking-wider text-[var(--text-secondary)]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(BASE_FIELD_CLASS, error && 'border-[var(--status-danger)]', className)}
        {...props}
      />
      {error && <span className="text-xs text-[var(--status-danger)]">{error}</span>}
      {!error && hint && <span className="text-xs text-[var(--text-muted)]">{hint}</span>}
    </div>
  );
}

export interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string | number; label: string }>;
}

export function FormSelect({ label, error, options, className, id, ...props }: FormSelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="font-mono-tech text-[11px] uppercase tracking-wider text-[var(--text-secondary)]"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(BASE_FIELD_CLASS, error && 'border-[var(--status-danger)]', className)}
        {...props}
      >
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-[var(--status-danger)]">{error}</span>}
    </div>
  );
}

export interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function FormTextarea({ label, error, className, id, ...props }: FormTextareaProps) {
  const areaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={areaId}
          className="font-mono-tech text-[11px] uppercase tracking-wider text-[var(--text-secondary)]"
        >
          {label}
        </label>
      )}
      <textarea
        id={areaId}
        rows={3}
        className={cn(BASE_FIELD_CLASS, 'resize-y min-h-[84px]', error && 'border-[var(--status-danger)]', className)}
        {...props}
      />
      {error && <span className="text-xs text-[var(--status-danger)]">{error}</span>}
    </div>
  );
}
