import { Plus } from 'lucide-react';
import { BaseButton, type BaseButtonProps } from './BaseButton';

export interface CreateButtonProps extends Omit<BaseButtonProps, 'variant' | 'leftIcon'> {
  label: string;
}

export function CreateButton({ label, ...props }: CreateButtonProps) {
  return (
    <BaseButton
      variant="primary"
      leftIcon={<Plus className="w-4 h-4 shrink-0" />}
      {...props}
    >
      {label}
    </BaseButton>
  );
}
