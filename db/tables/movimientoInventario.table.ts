import type { DatabaseSync } from 'node:sqlite';
import { getDatabase } from '../connection.ts';

export interface MovimientoInventarioRow {
  id_movimiento: number;
  tipo_movimiento: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  fecha: string;
  motivo: string;
  id_producto: number;
  id_usuario: number;
  id_orden: number | null;
  anulado: boolean;
  producto_nombre: string;
  unidad_medida: string;
  usuario_nombre: string;
  vehiculo_placa: string | null;
}

const BASE_SELECT = `
  SELECT
    m.id_movimiento,
    m.tipo_movimiento,
    m.cantidad,
    m.fecha,
    m.motivo,
    m.id_producto,
    m.id_usuario,
    m.id_orden,
    m.anulado,
    p.nombre AS producto_nombre,
    p.unidad_medida,
    (u.nombre || ' ' || u.apellido) AS usuario_nombre,
    v.placa AS vehiculo_placa
  FROM movimientos_inventario m
  INNER JOIN productos p ON p.id_producto = m.id_producto
  INNER JOIN usuarios u ON u.id_usuario = m.id_usuario
  LEFT JOIN ordenes_trabajo o ON o.id_orden = m.id_orden
  LEFT JOIN vehiculos v ON v.id_vehiculo = o.id_vehiculo
`;

function mapRow(row: Record<string, unknown>): MovimientoInventarioRow {
  return {
    id_movimiento: Number(row.id_movimiento),
    tipo_movimiento: row.tipo_movimiento as 'ENTRADA' | 'SALIDA',
    cantidad: Number(row.cantidad),
    fecha: String(row.fecha),
    motivo: String(row.motivo),
    id_producto: Number(row.id_producto),
    id_usuario: Number(row.id_usuario),
    id_orden: row.id_orden === null || row.id_orden === undefined ? null : Number(row.id_orden),
    anulado: Boolean(row.anulado),
    producto_nombre: String(row.producto_nombre),
    unidad_medida: String(row.unidad_medida),
    usuario_nombre: String(row.usuario_nombre),
    vehiculo_placa: row.vehiculo_placa ? String(row.vehiculo_placa) : null,
  };
}

export const MovimientoInventarioTable = {
  listar(filters?: { tipo_movimiento?: string; id_producto?: number }): MovimientoInventarioRow[] {
    const db = getDatabase();
    const clauses: string[] = [];
    const params: Array<string | number> = [];

    if (filters?.tipo_movimiento && filters.tipo_movimiento !== 'TODOS') {
      clauses.push('m.tipo_movimiento = ?');
      params.push(filters.tipo_movimiento);
    }
    if (filters?.id_producto) {
      clauses.push('m.id_producto = ?');
      params.push(filters.id_producto);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = db
      .prepare(`${BASE_SELECT} ${where} ORDER BY m.id_movimiento DESC`)
      .all(...params) as unknown as Record<string, unknown>[];
    return rows.map(mapRow);
  },

  obtenerPorId(id_movimiento: number, txDb?: DatabaseSync): MovimientoInventarioRow | null {
    const db = txDb ?? getDatabase();
    const row = db
      .prepare(`${BASE_SELECT} WHERE m.id_movimiento = ?`)
      .get(id_movimiento) as unknown as Record<string, unknown> | undefined;
    return row ? mapRow(row) : null;
  },

  /**
   * +registrarEntrada(producto, cantidad, motivo)
   */
  registrarEntrada(
    data: { id_producto: number; cantidad: number; motivo: string; id_usuario: number },
    txDb?: DatabaseSync
  ): MovimientoInventarioRow {
    const db = txDb ?? getDatabase();
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const info = db
      .prepare(`
        INSERT INTO movimientos_inventario (tipo_movimiento, cantidad, fecha, motivo, id_producto, id_usuario, id_orden, anulado)
        VALUES ('ENTRADA', ?, ?, ?, ?, ?, NULL, 0)
      `)
      .run(data.cantidad, now, data.motivo.trim(), data.id_producto, data.id_usuario);
    return this.obtenerPorId(Number(info.lastInsertRowid), db)!;
  },

  /**
   * +registrarSalida(producto, cantidad, motivo)
   */
  registrarSalida(
    data: { id_producto: number; cantidad: number; motivo: string; id_usuario: number; id_orden?: number | null },
    txDb?: DatabaseSync
  ): MovimientoInventarioRow {
    const db = txDb ?? getDatabase();
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const info = db
      .prepare(`
        INSERT INTO movimientos_inventario (tipo_movimiento, cantidad, fecha, motivo, id_producto, id_usuario, id_orden, anulado)
        VALUES ('SALIDA', ?, ?, ?, ?, ?, ?, 0)
      `)
      .run(data.cantidad, now, data.motivo.trim(), data.id_producto, data.id_usuario, data.id_orden ?? null);
    return this.obtenerPorId(Number(info.lastInsertRowid), db)!;
  },

  /**
   * +anular() (marca como anulado; el controlador revierte el stock)
   */
  marcarAnulado(id_movimiento: number, txDb?: DatabaseSync): MovimientoInventarioRow {
    const db = txDb ?? getDatabase();
    db.prepare('UPDATE movimientos_inventario SET anulado = 1 WHERE id_movimiento = ?').run(id_movimiento);
    return this.obtenerPorId(id_movimiento, db)!;
  },
};
