import { CheckCircle2 } from 'lucide-react';
import { BaseButton, type BaseButtonProps } from './BaseButton';

export interface CloseOrderButtonProps extends Omit<BaseButtonProps, 'variant' | 'leftIcon'> {
  label?: string;
}

export function CloseOrderButton({ label = 'Cerrar Orden', ...props }: CloseOrderButtonProps) {
  return (
    <BaseButton
      variant="success"
      leftIcon={<CheckCircle2 className="w-4 h-4 shrink-0" />}
      {...props}
    >
      {label}
    </BaseButton>
  );
}
