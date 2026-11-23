import { Trash2 } from 'lucide-react';
import { BaseButton, type BaseButtonProps } from './BaseButton';

export interface DeleteButtonProps extends Omit<BaseButtonProps, 'variant' | 'leftIcon'> {
  label?: string;
  iconOnly?: boolean;
}

export function DeleteButton({
  label = 'Eliminar',
  iconOnly = false,
  size = 'xs',
  ...props
}: DeleteButtonProps) {
  return (
    <BaseButton
      variant="danger"
      size={size}
      title={label}
      aria-label={label}
      leftIcon={<Trash2 className="w-3.5 h-3.5 shrink-0" />}
      {...props}
    >
      {!iconOnly && label}
    </BaseButton>
  );
}
