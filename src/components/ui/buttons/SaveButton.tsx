import { Save } from 'lucide-react';
import { BaseButton, type BaseButtonProps } from './BaseButton';

export interface SaveButtonProps extends Omit<BaseButtonProps, 'variant' | 'leftIcon'> {
  label?: string;
}

export function SaveButton({ label = 'Guardar cambios', type = 'submit', ...props }: SaveButtonProps) {
  return (
    <BaseButton
      type={type}
      variant="primary"
      leftIcon={<Save className="w-4 h-4 shrink-0" />}
      {...props}
    >
      {label}
    </BaseButton>
  );
}
