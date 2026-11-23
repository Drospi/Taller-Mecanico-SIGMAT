import { getDatabase } from '../connection.ts';

export interface RolRow {
  id_rol: number;
  nombre_rol: string;
  total_usuarios?: number;
}

export const RolTable = {
  listar(): RolRow[] {
    const db = getDatabase();
    return db
      .prepare(`
        SELECT r.id_rol, r.nombre_rol, COUNT(u.id_usuario) AS total_usuarios
        FROM roles r
        LEFT JOIN usuarios u ON u.id_rol = r.id_rol
        GROUP BY r.id_rol, r.nombre_rol
        ORDER BY r.id_rol ASC
      `)
      .all() as unknown as RolRow[];
  },

  registrar(nombre_rol: string): RolRow {
    const db = getDatabase();
    const trimmed = nombre_rol.trim();
    if (!trimmed) throw new Error('El nombre del rol es obligatorio.');
    const info = db.prepare('INSERT INTO roles (nombre_rol) VALUES (?)').run(trimmed);
    return db
      .prepare('SELECT id_rol, nombre_rol, 0 AS total_usuarios FROM roles WHERE id_rol = ?')
      .get(Number(info.lastInsertRowid)) as unknown as RolRow;
  },

  editar(id_rol: number, nombre_rol: string): RolRow {
    const db = getDatabase();
    const trimmed = nombre_rol.trim();
    if (!trimmed) throw new Error('El nombre del rol es obligatorio.');
    db.prepare('UPDATE roles SET nombre_rol = ? WHERE id_rol = ?').run(trimmed, id_rol);
    const updated = db
      .prepare(`
        SELECT r.id_rol, r.nombre_rol, COUNT(u.id_usuario) AS total_usuarios
        FROM roles r
        LEFT JOIN usuarios u ON u.id_rol = r.id_rol
        WHERE r.id_rol = ?
        GROUP BY r.id_rol, r.nombre_rol
      `)
      .get(id_rol) as unknown as RolRow | undefined;
    if (!updated) throw new Error('Rol no encontrado.');
    return updated;
  },

  listarUsuarios(id_rol: number) {
    const db = getDatabase();
    return db
      .prepare(`
        SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.estado, u.id_rol, r.nombre_rol
        FROM usuarios u
        INNER JOIN roles r ON r.id_rol = u.id_rol
        WHERE u.id_rol = ?
        ORDER BY u.id_usuario ASC
      `)
      .all(id_rol)
      .map((row) => ({
        ...(row as Record<string, unknown>),
        estado: Boolean((row as Record<string, unknown>).estado),
      }));
  },
};
