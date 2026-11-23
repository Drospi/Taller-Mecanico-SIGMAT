import { Pencil } from 'lucide-react';
import { BaseButton, type BaseButtonProps } from './BaseButton';

export interface EditButtonProps extends Omit<BaseButtonProps, 'variant' | 'leftIcon'> {
  label?: string;
  iconOnly?: boolean;
}

export function EditButton({
  label = 'Editar',
  iconOnly = false,
  size = 'xs',
  ...props
}: EditButtonProps) {
  return (
    <BaseButton
      variant="secondary"
      size={size}
      title={label}
      aria-label={label}
      leftIcon={<Pencil className="w-3.5 h-3.5 shrink-0" />}
      {...props}
    >
      {!iconOnly && label}
    </BaseButton>
  );
}
