import type { DatabaseSync } from 'node:sqlite';
import { getDatabase } from '../connection.ts';

export interface DetalleOrdenRepuestoRow {
  id_detalle: number;
  cantidad: number;
  precio_unitario: number;
  id_orden: number;
  id_producto: number;
  producto_nombre: string;
  unidad_medida: string;
  subtotal: number;
}

export const DetalleOrdenRepuestoTable = {
  listarPorOrden(id_orden: number, txDb?: DatabaseSync): DetalleOrdenRepuestoRow[] {
    const db = txDb ?? getDatabase();
    return db
      .prepare(`
        SELECT
          d.id_detalle,
          d.cantidad,
          d.precio_unitario,
          d.id_orden,
          d.id_producto,
          p.nombre AS producto_nombre,
          p.unidad_medida,
          ROUND(d.cantidad * d.precio_unitario, 2) AS subtotal
        FROM detalle_orden_repuesto d
        INNER JOIN productos p ON p.id_producto = d.id_producto
        WHERE d.id_orden = ?
        ORDER BY d.id_detalle ASC
      `)
      .all(id_orden) as unknown as DetalleOrdenRepuestoRow[];
  },

  obtenerPorId(id_detalle: number, txDb?: DatabaseSync): DetalleOrdenRepuestoRow | null {
    const db = txDb ?? getDatabase();
    const row = db
      .prepare(`
        SELECT
          d.id_detalle,
          d.cantidad,
          d.precio_unitario,
          d.id_orden,
          d.id_producto,
          p.nombre AS producto_nombre,
          p.unidad_medida,
          ROUND(d.cantidad * d.precio_unitario, 2) AS subtotal
        FROM detalle_orden_repuesto d
        INNER JOIN productos p ON p.id_producto = d.id_producto
        WHERE d.id_detalle = ?
      `)
      .get(id_detalle) as unknown as DetalleOrdenRepuestoRow | undefined;
    return row ?? null;
  },

  registrar(
    data: { id_orden: number; id_producto: number; cantidad: number; precio_unitario: number },
    txDb?: DatabaseSync
  ): DetalleOrdenRepuestoRow {
    const db = txDb ?? getDatabase();
    const existing = db
      .prepare('SELECT id_detalle, cantidad FROM detalle_orden_repuesto WHERE id_orden = ? AND id_producto = ?')
      .get(data.id_orden, data.id_producto) as { id_detalle: number; cantidad: number } | undefined;

    if (existing) {
      return this.actualizarCantidad(existing.id_detalle, existing.cantidad + data.cantidad, db);
    }

    const info = db
      .prepare(`
        INSERT INTO detalle_orden_repuesto (cantidad, precio_unitario, id_orden, id_producto)
        VALUES (?, ?, ?, ?)
      `)
      .run(data.cantidad, data.precio_unitario, data.id_orden, data.id_producto);

    const created = this.obtenerPorId(Number(info.lastInsertRowid), db);
    if (!created) throw new Error('Error al registrar detalle de repuesto.');
    return created;
  },

  /**
   * +actualizarCantidad(cantidad)
   */
  actualizarCantidad(id_detalle: number, nuevaCantidad: number, txDb?: DatabaseSync): DetalleOrdenRepuestoRow {
    const db = txDb ?? getDatabase();
    if (nuevaCantidad <= 0) throw new Error('La cantidad debe ser mayor a cero.');
    db.prepare('UPDATE detalle_orden_repuesto SET cantidad = ? WHERE id_detalle = ?').run(
      nuevaCantidad,
      id_detalle
    );
    const updated = this.obtenerPorId(id_detalle, db);
    if (!updated) throw new Error('Detalle de orden no encontrado.');
    return updated;
  },

  /**
   * +calcularSubtotal() : decimal
   */
  calcularSubtotal(cantidad: number, precio_unitario: number): number {
    return Number((cantidad * precio_unitario).toFixed(2));
  },
};
