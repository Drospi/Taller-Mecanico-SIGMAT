import { Wrench } from 'lucide-react';
import { BaseButton, type BaseButtonProps } from './BaseButton';

export interface AssignPartButtonProps extends Omit<BaseButtonProps, 'variant' | 'leftIcon'> {
  label?: string;
}

export function AssignPartButton({ label = 'Asignar Repuesto', ...props }: AssignPartButtonProps) {
  return (
    <BaseButton
      variant="primary"
      leftIcon={<Wrench className="w-4 h-4 shrink-0" />}
      {...props}
    >
      {label}
    </BaseButton>
  );
}
