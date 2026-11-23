import { BellOff } from 'lucide-react';
import { BaseButton, type BaseButtonProps } from './BaseButton';

export interface ResolveAlertButtonProps extends Omit<BaseButtonProps, 'variant' | 'leftIcon'> {
  label?: string;
}

export function ResolveAlertButton({ label = 'Resolver Alerta', ...props }: ResolveAlertButtonProps) {
  return (
    <BaseButton
      variant="success"
      leftIcon={<BellOff className="w-3.5 h-3.5 shrink-0" />}
      {...props}
    >
      {label}
    </BaseButton>
  );
}
