import { Eye } from 'lucide-react';
import { BaseButton, type BaseButtonProps } from './BaseButton';

export interface ViewDetailButtonProps extends Omit<BaseButtonProps, 'variant' | 'leftIcon'> {
  label?: string;
  iconOnly?: boolean;
}

export function ViewDetailButton({
  label = 'Ver detalle',
  iconOnly = false,
  size = 'xs',
  ...props
}: ViewDetailButtonProps) {
  return (
    <BaseButton
      variant="ghost"
      size={size}
      title={label}
      aria-label={label}
      leftIcon={<Eye className="w-3.5 h-3.5 shrink-0" />}
      {...props}
    >
      {!iconOnly && label}
    </BaseButton>
  );
}
