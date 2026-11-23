import type { DatabaseSync } from 'node:sqlite';
import { getDatabase } from '../connection.ts';

export interface OrdenTrabajoRow {
  id_orden: number;
  fecha_ingreso: string;
  fecha_cierre: string | null;
  diagnostico: string;
  estado: 'ABIERTA' | 'EN_PROCESO' | 'CERRADA';
  id_mecanico: number;
  id_vehiculo: number;
  mecanico_nombre: string;
  vehiculo_placa: string;
  vehiculo_marca: string;
  vehiculo_modelo: string;
  vehiculo_anio: number;
  propietario_nombre: string;
  propietario_telefono: string;
  total_repuestos: number;
  cantidad_items: number;
}

const BASE_SELECT = `
  SELECT
    o.id_orden,
    o.fecha_ingreso,
    o.fecha_cierre,
    o.diagnostico,
    o.estado,
    o.id_mecanico,
    o.id_vehiculo,
    (u.nombre || ' ' || u.apellido) AS mecanico_nombre,
    v.placa AS vehiculo_placa,
    v.marca AS vehiculo_marca,
    v.modelo AS vehiculo_modelo,
    v.anio AS vehiculo_anio,
    v.propietario_nombre,
    v.propietario_telefono,
    COALESCE(SUM(d.cantidad * d.precio_unitario), 0) AS total_repuestos,
    COALESCE(SUM(d.cantidad), 0) AS cantidad_items
  FROM ordenes_trabajo o
  INNER JOIN usuarios u ON u.id_usuario = o.id_mecanico
  INNER JOIN vehiculos v ON v.id_vehiculo = o.id_vehiculo
  LEFT JOIN detalle_orden_repuesto d ON d.id_orden = o.id_orden
`;

export const OrdenTrabajoTable = {
  listar(filters?: { estado?: string; id_mecanico?: number; id_vehiculo?: number }): OrdenTrabajoRow[] {
    const db = getDatabase();
    const clauses: string[] = [];
    const params: Array<string | number> = [];

    if (filters?.estado && filters.estado !== 'TODOS') {
      clauses.push('o.estado = ?');
      params.push(filters.estado);
    }
    if (filters?.id_mecanico) {
      clauses.push('o.id_mecanico = ?');
      params.push(filters.id_mecanico);
    }
    if (filters?.id_vehiculo) {
      clauses.push('o.id_vehiculo = ?');
      params.push(filters.id_vehiculo);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const sql = `${BASE_SELECT} ${where} GROUP BY o.id_orden ORDER BY o.id_orden DESC`;
    return db.prepare(sql).all(...params) as unknown as OrdenTrabajoRow[];
  },

  obtenerPorId(id_orden: number, txDb?: DatabaseSync): OrdenTrabajoRow | null {
    const db = txDb ?? getDatabase();
    const row = db
      .prepare(`${BASE_SELECT} WHERE o.id_orden = ? GROUP BY o.id_orden`)
      .get(id_orden) as unknown as OrdenTrabajoRow | undefined;
    return row ?? null;
  },

  /**
   * +abrir()
   */
  abrir(data: { id_vehiculo: number; id_mecanico: number; diagnostico: string }): OrdenTrabajoRow {
    const db = getDatabase();
    if (!data.diagnostico.trim()) {
      throw new Error('Debe ingresar un diagnóstico o motivo de ingreso.');
    }
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const info = db
      .prepare(`
        INSERT INTO ordenes_trabajo (fecha_ingreso, fecha_cierre, diagnostico, estado, id_mecanico, id_vehiculo)
        VALUES (?, NULL, ?, 'ABIERTA', ?, ?)
      `)
      .run(now, data.diagnostico.trim(), data.id_mecanico, data.id_vehiculo);

    const created = this.obtenerPorId(Number(info.lastInsertRowid));
    if (!created) throw new Error('Error al abrir la orden de trabajo.');
    return created;
  },

  /**
   * +registrarDiagnostico(texto)
   */
  registrarDiagnostico(id_orden: number, diagnostico: string, estado?: 'ABIERTA' | 'EN_PROCESO'): OrdenTrabajoRow {
    const db = getDatabase();
    const current = this.obtenerPorId(id_orden);
    if (!current) throw new Error('Orden de trabajo no encontrada.');
    if (current.estado === 'CERRADA') {
      throw new Error('No se puede modificar el diagnóstico de una orden cerrada.');
    }

    const nextEstado = estado ?? (current.estado === 'ABIERTA' ? 'EN_PROCESO' : current.estado);
    db.prepare('UPDATE ordenes_trabajo SET diagnostico = ?, estado = ? WHERE id_orden = ?').run(
      diagnostico.trim(),
      nextEstado,
      id_orden
    );
    return this.obtenerPorId(id_orden)!;
  },

  /**
   * +cerrar()
   */
  cerrar(id_orden: number): OrdenTrabajoRow {
    const db = getDatabase();
    const current = this.obtenerPorId(id_orden);
    if (!current) throw new Error('Orden de trabajo no encontrada.');
    if (current.estado === 'CERRADA') {
      throw new Error('La orden de trabajo ya se encuentra cerrada.');
    }
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    db.prepare(`UPDATE ordenes_trabajo SET estado = 'CERRADA', fecha_cierre = ? WHERE id_orden = ?`).run(
      now,
      id_orden
    );
    return this.obtenerPorId(id_orden)!;
  },

  /**
   * +calcularTotalRepuestos() : decimal
   */
  calcularTotalRepuestos(id_orden: number, txDb?: DatabaseSync): number {
    const db = txDb ?? getDatabase();
    const row = db
      .prepare(
        'SELECT COALESCE(SUM(cantidad * precio_unitario), 0) AS total FROM detalle_orden_repuesto WHERE id_orden = ?'
      )
      .get(id_orden) as { total: number };
    return Number(Number(row.total).toFixed(2));
  },

  /**
   * +listarRepuestosAsignados() : List<DetalleOrdenRepuesto>
   */
  listarRepuestosAsignados(id_orden: number, txDb?: DatabaseSync) {
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
      .all(id_orden);
  },
};
