import { FileText } from 'lucide-react';
import { BaseButton, type BaseButtonProps } from './BaseButton';

export interface ExportPdfButtonProps extends Omit<BaseButtonProps, 'variant' | 'leftIcon'> {
  label?: string;
}

export function ExportPdfButton({ label = 'Exportar PDF', ...props }: ExportPdfButtonProps) {
  return (
    <BaseButton
      variant="outline-accent"
      leftIcon={<FileText className="w-4 h-4 shrink-0" />}
      {...props}
    >
      {label}
    </BaseButton>
  );
}
