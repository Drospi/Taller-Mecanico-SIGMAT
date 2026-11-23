import { getDatabase } from '../connection.ts';

export interface VehiculoRow {
  id_vehiculo: number;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  propietario_nombre: string;
  propietario_telefono: string;
  total_ordenes?: number;
}

export const VehiculoTable = {
  listar(): VehiculoRow[] {
    const db = getDatabase();
    return db
      .prepare(`
        SELECT v.*, COUNT(o.id_orden) AS total_ordenes
        FROM vehiculos v
        LEFT JOIN ordenes_trabajo o ON o.id_vehiculo = v.id_vehiculo
        GROUP BY v.id_vehiculo
        ORDER BY v.id_vehiculo DESC
      `)
      .all() as unknown as VehiculoRow[];
  },

  obtenerPorId(id_vehiculo: number): VehiculoRow | null {
    const db = getDatabase();
    const row = db
      .prepare(`
        SELECT v.*, COUNT(o.id_orden) AS total_ordenes
        FROM vehiculos v
        LEFT JOIN ordenes_trabajo o ON o.id_vehiculo = v.id_vehiculo
        WHERE v.id_vehiculo = ?
        GROUP BY v.id_vehiculo
      `)
      .get(id_vehiculo) as unknown as VehiculoRow | undefined;
    return row ?? null;
  },

  registrar(data: {
    placa: string;
    marca: string;
    modelo: string;
    anio: number;
    propietario_nombre: string;
    propietario_telefono: string;
  }): VehiculoRow {
    const db = getDatabase();
    const placa = data.placa.trim().toUpperCase();
    const dup = db.prepare('SELECT id_vehiculo FROM vehiculos WHERE UPPER(placa) = ?').get(placa);
    if (dup) throw new Error(`Ya existe un vehículo registrado con la placa ${placa}.`);

    const info = db
      .prepare(`
        INSERT INTO vehiculos (placa, marca, modelo, anio, propietario_nombre, propietario_telefono)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(
        placa,
        data.marca.trim(),
        data.modelo.trim(),
        Number(data.anio),
        data.propietario_nombre.trim(),
        data.propietario_telefono.trim()
      );

    const created = this.obtenerPorId(Number(info.lastInsertRowid));
    if (!created) throw new Error('No se pudo registrar el vehículo.');
    return created;
  },

  editar(
    id_vehiculo: number,
    data: {
      placa: string;
      marca: string;
      modelo: string;
      anio: number;
      propietario_nombre: string;
      propietario_telefono: string;
    }
  ): VehiculoRow {
    const db = getDatabase();
    const placa = data.placa.trim().toUpperCase();
    const dup = db
      .prepare('SELECT id_vehiculo FROM vehiculos WHERE UPPER(placa) = ? AND id_vehiculo != ?')
      .get(placa, id_vehiculo);
    if (dup) throw new Error(`La placa ${placa} ya pertenece a otro vehículo.`);

    db.prepare(`
      UPDATE vehiculos
      SET placa = ?, marca = ?, modelo = ?, anio = ?, propietario_nombre = ?, propietario_telefono = ?
      WHERE id_vehiculo = ?
    `).run(
      placa,
      data.marca.trim(),
      data.modelo.trim(),
      Number(data.anio),
      data.propietario_nombre.trim(),
      data.propietario_telefono.trim(),
      id_vehiculo
    );
    const updated = this.obtenerPorId(id_vehiculo);
    if (!updated) throw new Error('Vehículo no encontrado.');
    return updated;
  },

  consultarHistorialOrdenes(id_vehiculo: number) {
    const db = getDatabase();
    return db
      .prepare(`
        SELECT
          o.*,
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
        WHERE o.id_vehiculo = ?
        GROUP BY o.id_orden
        ORDER BY o.fecha_ingreso DESC
      `)
      .all(id_vehiculo);
  },
};
