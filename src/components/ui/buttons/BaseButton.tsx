import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../../utils/cn';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'dark'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'outline-accent';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface BaseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)] border border-transparent shadow-sm',
  secondary:
    'bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)]',
  dark:
    'bg-[#0E1014] text-[#F7F8FA] hover:bg-[#1B1E25] border border-[#2C303A]',
  ghost:
    'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-transparent',
  danger:
    'bg-[var(--status-danger-soft)] text-[var(--status-danger)] hover:bg-[var(--status-danger)] hover:text-white border border-[var(--status-danger)]/35',
  success:
    'bg-[var(--status-ok-soft)] text-[var(--status-ok)] hover:bg-[var(--status-ok)] hover:text-[#0A0A0C] border border-[var(--status-ok)]/35',
  'outline-accent':
    'bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white border border-[var(--accent-border)]',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1.5',
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2.5',
};

export function BaseButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: BaseButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium tracking-tight rounded-[4px] transition-all duration-150 cursor-pointer select-none whitespace-nowrap',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
