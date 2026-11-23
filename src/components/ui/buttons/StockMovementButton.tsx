import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { TipoMovimiento } from '../../../types/models';
import { BaseButton, type BaseButtonProps } from './BaseButton';

export interface StockMovementButtonProps extends Omit<BaseButtonProps, 'variant' | 'leftIcon'> {
  tipo: TipoMovimiento;
  label?: string;
}

export function StockMovementButton({ tipo, label, ...props }: StockMovementButtonProps) {
  const isEntrada = tipo === 'ENTRADA';
  return (
    <BaseButton
      variant={isEntrada ? 'success' : 'outline-accent'}
      leftIcon={
        isEntrada ? (
          <ArrowDownLeft className="w-4 h-4 shrink-0" />
        ) : (
          <ArrowUpRight className="w-4 h-4 shrink-0" />
        )
      }
      {...props}
    >
      {label ?? (isEntrada ? 'Registrar Entrada' : 'Registrar Salida')}
    </BaseButton>
  );
}
