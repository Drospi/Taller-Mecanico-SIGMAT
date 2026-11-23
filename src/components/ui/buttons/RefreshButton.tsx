import { RefreshCw } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { BaseButton, type BaseButtonProps } from './BaseButton';

export interface RefreshButtonProps extends Omit<BaseButtonProps, 'variant' | 'leftIcon'> {
  spinning?: boolean;
  label?: string;
}

export function RefreshButton({
  spinning = false,
  label = 'Actualizar',
  size = 'sm',
  ...props
}: RefreshButtonProps) {
  return (
    <BaseButton
      variant="secondary"
      size={size}
      leftIcon={<RefreshCw className={cn('w-3.5 h-3.5 shrink-0', spinning && 'animate-spin')} />}
      {...props}
    >
      {label}
    </BaseButton>
  );
}
