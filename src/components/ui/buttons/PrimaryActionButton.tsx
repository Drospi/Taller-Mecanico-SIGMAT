import { ArrowRight } from 'lucide-react';
import { BaseButton, type BaseButtonProps } from './BaseButton';

export interface PrimaryActionButtonProps extends Omit<BaseButtonProps, 'variant' | 'rightIcon'> {
  label: string;
  invertOnBanner?: boolean;
}

export function PrimaryActionButton({
  label,
  invertOnBanner = false,
  ...props
}: PrimaryActionButtonProps) {
  return (
    <BaseButton
      variant={invertOnBanner ? 'dark' : 'primary'}
      rightIcon={<ArrowRight className="w-4 h-4 shrink-0" />}
      {...props}
    >
      {label}
    </BaseButton>
  );
}
