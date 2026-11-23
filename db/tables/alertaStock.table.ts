import type { DatabaseSync } from 'node:sqlite';
import { getDatabase } from '../connection.ts';

export interface AlertaStockRow {
  id_alerta: number;
  fecha_generada: string;
  estado: 'PENDIENTE' | 'RESUELTA';
  id_producto: number;
  producto_nombre: string;
  categoria_nombre: string;
  stock_actual: number;
  nivel_minimo: number;
  unidad_medida: string;
}

const BASE_SELECT = `
  SELECT
    a.id_alerta,
    a.fecha_generada,
    a.estado,
    a.id_producto,
    p.nombre AS producto_nombre,
    c.nombre AS categoria_nombre,
    p.stock_actual,
    p.nivel_minimo,
    p.unidad_medida
  FROM alertas_stock a
  INNER JOIN productos p ON p.id_producto = a.id_producto
  INNER JOIN categorias c ON c.id_categoria = p.id_categoria
`;

export const AlertaStockTable = {
  listarTodas(): AlertaStockRow[] {
    const db = getDatabase();
    return db
      .prepare(`${BASE_SELECT} ORDER BY CASE WHEN a.estado = 'PENDIENTE' THEN 0 ELSE 1 END, a.id_alerta DESC`)
      .all() as unknown as AlertaStockRow[];
  },

  /**
   * +listarPendientes() : List<AlertaStock>
   */
  listarPendientes(txDb?: DatabaseSync): AlertaStockRow[] {
    const db = txDb ?? getDatabase();
    return db
      .prepare(`${BASE_SELECT} WHERE a.estado = 'PENDIENTE' ORDER BY a.id_alerta DESC`)
      .all() as unknown as AlertaStockRow[];
  },

  obtenerPorId(id_alerta: number, txDb?: DatabaseSync): AlertaStockRow | null {
    const db = txDb ?? getDatabase();
    const row = db
      .prepare(`${BASE_SELECT} WHERE a.id_alerta = ?`)
      .get(id_alerta) as unknown as AlertaStockRow | undefined;
    return row ?? null;
  },

  obtenerPendientePorProducto(id_producto: number, txDb?: DatabaseSync): AlertaStockRow | null {
    const db = txDb ?? getDatabase();
    const row = db
      .prepare(`${BASE_SELECT} WHERE a.id_producto = ? AND a.estado = 'PENDIENTE' LIMIT 1`)
      .get(id_producto) as unknown as AlertaStockRow | undefined;
    return row ?? null;
  },

  /**
   * +generar()
   */
  generar(id_producto: number, txDb?: DatabaseSync): AlertaStockRow {
    const db = txDb ?? getDatabase();
    const existing = this.obtenerPendientePorProducto(id_producto, db);
    if (existing) {
      return existing;
    }
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const info = db
      .prepare(`INSERT INTO alertas_stock (fecha_generada, estado, id_producto) VALUES (?, 'PENDIENTE', ?)`)
      .run(now, id_producto);
    return this.obtenerPorId(Number(info.lastInsertRowid), db)!;
  },

  /**
   * +resolver()
   */
  resolver(id_alerta: number, txDb?: DatabaseSync): AlertaStockRow {
    const db = txDb ?? getDatabase();
    db.prepare(`UPDATE alertas_stock SET estado = 'RESUELTA' WHERE id_alerta = ?`).run(id_alerta);
    const updated = this.obtenerPorId(id_alerta, db);
    if (!updated) throw new Error('Alerta de stock no encontrada.');
    return updated;
  },
};
