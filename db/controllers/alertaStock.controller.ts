import type { DatabaseSync } from 'node:sqlite';
import { ProductoTable } from '../tables/producto.table.ts';
import { AlertaStockTable, type AlertaStockRow } from '../tables/alertaStock.table.ts';

/**
 * ControladorAlertaStock (Diagrama de Robustez — Paso 5 y 6)
 * Verifica si stock_actual <= nivel_minimo y genera la alerta de stock mínimo automáticamente.
 */
export const ControladorAlertaStock = {
  verificarYGenerarAlerta(id_producto: number, txDb?: DatabaseSync): AlertaStockRow | null {
    const enNivelMinimo = ProductoTable.verificarStockMinimo(id_producto, txDb);
    if (enNivelMinimo) {
      return AlertaStockTable.generar(id_producto, txDb);
    }
    return null;
  },

  resolverSiStockSuficiente(id_producto: number, txDb?: DatabaseSync): void {
    const enNivelMinimo = ProductoTable.verificarStockMinimo(id_producto, txDb);
    if (!enNivelMinimo) {
      const pendiente = AlertaStockTable.obtenerPendientePorProducto(id_producto, txDb);
      if (pendiente) {
        AlertaStockTable.resolver(pendiente.id_alerta, txDb);
      }
    }
  },

  resolverManual(id_alerta: number): AlertaStockRow {
    return AlertaStockTable.resolver(id_alerta);
  },
};
