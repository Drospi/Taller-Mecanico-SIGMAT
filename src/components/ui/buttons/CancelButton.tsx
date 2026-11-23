import { X } from 'lucide-react';
import { BaseButton, type BaseButtonProps } from './BaseButton';

export interface CancelButtonProps extends Omit<BaseButtonProps, 'variant' | 'leftIcon'> {
  label?: string;
}

export function CancelButton({ label = 'Cancelar', ...props }: CancelButtonProps) {
  return (
    <BaseButton
      variant="secondary"
      leftIcon={<X className="w-4 h-4 shrink-0" />}
      {...props}
    >
      {label}
    </BaseButton>
  );
}
