import { runInTransaction } from '../connection.ts';
import { ProductoTable, type ProductoRow } from '../tables/producto.table.ts';
import { MovimientoInventarioTable, type MovimientoInventarioRow } from '../tables/movimientoInventario.table.ts';
import type { AlertaStockRow } from '../tables/alertaStock.table.ts';
import { ControladorAlertaStock } from './alertaStock.controller.ts';

export interface MovimientoResult {
  movimiento: MovimientoInventarioRow;
  producto: ProductoRow;
  alertaGenerada: AlertaStockRow | null;
}

/**
 * ControladorInventario (Diagrama de Actividades — Módulo Inventario)
 * Maneja ENTRADA y SALIDA de inventario, actualización de stock y verificación automática de alertas.
 */
export const ControladorInventario = {
  registrarMovimiento(params: {
    tipo_movimiento: 'ENTRADA' | 'SALIDA';
    id_producto: number;
    cantidad: number;
    motivo: string;
    id_usuario: number;
    id_orden?: number | null;
  }): MovimientoResult {
    const cantidad = Math.floor(Number(params.cantidad));
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      throw new Error('La cantidad debe ser un entero mayor a 0.');
    }
    if (!params.motivo.trim()) {
      throw new Error('Debe especificar el motivo del movimiento de inventario.');
    }

    return runInTransaction((txDb) => {
      const productoActualizado = ProductoTable.actualizarStock(
        params.id_producto,
        cantidad,
        params.tipo_movimiento,
        txDb
      );

      const movimiento =
        params.tipo_movimiento === 'ENTRADA'
          ? MovimientoInventarioTable.registrarEntrada(
              {
                id_producto: params.id_producto,
                cantidad,
                motivo: params.motivo,
                id_usuario: params.id_usuario,
              },
              txDb
            )
          : MovimientoInventarioTable.registrarSalida(
              {
                id_producto: params.id_producto,
                cantidad,
                motivo: params.motivo,
                id_usuario: params.id_usuario,
                id_orden: params.id_orden ?? null,
              },
              txDb
            );

      // «include» Generar Alerta de Stock Mínimo (tanto en Entrada como en Salida, según el Diagrama de Casos de Uso)
      let alertaGenerada: AlertaStockRow | null = null;
      if (productoActualizado.stock_actual <= productoActualizado.nivel_minimo) {
        alertaGenerada = ControladorAlertaStock.verificarYGenerarAlerta(
          productoActualizado.id_producto,
          txDb
        );
      } else {
        ControladorAlertaStock.resolverSiStockSuficiente(productoActualizado.id_producto, txDb);
      }

      return {
        movimiento,
        producto: productoActualizado,
        alertaGenerada,
      };
    });
  },

  /**
   * Revierte el stock y marca el movimiento como anulado (MovimientoInventario.anular())
   */
  anularMovimiento(id_movimiento: number): MovimientoResult {
    return runInTransaction((txDb) => {
      const mov = MovimientoInventarioTable.obtenerPorId(id_movimiento, txDb);
      if (!mov) throw new Error('Movimiento de inventario no encontrado.');
      if (mov.anulado) throw new Error('Este movimiento ya fue anulado previamente.');

      const tipoInverso: 'ENTRADA' | 'SALIDA' = mov.tipo_movimiento === 'ENTRADA' ? 'SALIDA' : 'ENTRADA';
      const productoActualizado = ProductoTable.actualizarStock(
        mov.id_producto,
        mov.cantidad,
        tipoInverso,
        txDb
      );

      const movimientoAnulado = MovimientoInventarioTable.marcarAnulado(id_movimiento, txDb);
      const alertaGenerada = ControladorAlertaStock.verificarYGenerarAlerta(
        productoActualizado.id_producto,
        txDb
      );

      return {
        movimiento: movimientoAnulado,
        producto: productoActualizado,
        alertaGenerada,
      };
    });
  },
};
