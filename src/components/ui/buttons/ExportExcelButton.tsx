import { FileSpreadsheet } from 'lucide-react';
import { BaseButton, type BaseButtonProps } from './BaseButton';

export interface ExportExcelButtonProps extends Omit<BaseButtonProps, 'variant' | 'leftIcon'> {
  label?: string;
}

export function ExportExcelButton({ label = 'Exportar Excel', ...props }: ExportExcelButtonProps) {
  return (
    <BaseButton
      variant="success"
      leftIcon={<FileSpreadsheet className="w-4 h-4 shrink-0" />}
      {...props}
    >
      {label}
    </BaseButton>
  );
}
