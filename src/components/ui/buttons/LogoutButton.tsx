import { LogOut } from 'lucide-react';
import { BaseButton, type BaseButtonProps } from './BaseButton';

export interface LogoutButtonProps extends Omit<BaseButtonProps, 'variant' | 'leftIcon'> {
  label?: string;
  compact?: boolean;
}

export function LogoutButton({
  label = 'Cerrar Sesión',
  compact = false,
  size = 'sm',
  ...props
}: LogoutButtonProps) {
  return (
    <BaseButton
      variant="ghost"
      size={size}
      title={label}
      aria-label={label}
      leftIcon={<LogOut className="w-4 h-4 shrink-0" />}
      {...props}
    >
      {!compact && label}
    </BaseButton>
  );
}
