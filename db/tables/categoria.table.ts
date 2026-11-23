import { getDatabase } from '../connection.ts';

export interface CategoriaRow {
  id_categoria: number;
  nombre: string;
  descripcion: string;
  total_productos?: number;
}

export const CategoriaTable = {
  listar(): CategoriaRow[] {
    const db = getDatabase();
    return db
      .prepare(`
        SELECT c.*, COUNT(p.id_producto) AS total_productos
        FROM categorias c
        LEFT JOIN productos p ON p.id_categoria = c.id_categoria
        GROUP BY c.id_categoria
        ORDER BY c.id_categoria ASC
      `)
      .all() as unknown as CategoriaRow[];
  },

  obtenerPorId(id_categoria: number): CategoriaRow | null {
    const db = getDatabase();
    const row = db
      .prepare(`
        SELECT c.*, COUNT(p.id_producto) AS total_productos
        FROM categorias c
        LEFT JOIN productos p ON p.id_categoria = c.id_categoria
        WHERE c.id_categoria = ?
        GROUP BY c.id_categoria
      `)
      .get(id_categoria) as unknown as CategoriaRow | undefined;
    return row ?? null;
  },

  registrar(data: { nombre: string; descripcion: string }): CategoriaRow {
    const db = getDatabase();
    const nombre = data.nombre.trim();
    if (!nombre) throw new Error('El nombre de la categoría es obligatorio.');
    const dup = db.prepare('SELECT id_categoria FROM categorias WHERE LOWER(nombre) = LOWER(?)').get(nombre);
    if (dup) throw new Error(`La categoría "${nombre}" ya existe.`);

    const info = db
      .prepare('INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)')
      .run(nombre, data.descripcion.trim());
    const created = this.obtenerPorId(Number(info.lastInsertRowid));
    if (!created) throw new Error('Error al crear categoría.');
    return created;
  },

  editar(id_categoria: number, data: { nombre: string; descripcion: string }): CategoriaRow {
    const db = getDatabase();
    const nombre = data.nombre.trim();
    if (!nombre) throw new Error('El nombre de la categoría es obligatorio.');
    const dup = db
      .prepare('SELECT id_categoria FROM categorias WHERE LOWER(nombre) = LOWER(?) AND id_categoria != ?')
      .get(nombre, id_categoria);
    if (dup) throw new Error(`Ya existe otra categoría con el nombre "${nombre}".`);

    db.prepare('UPDATE categorias SET nombre = ?, descripcion = ? WHERE id_categoria = ?').run(
      nombre,
      data.descripcion.trim(),
      id_categoria
    );
    const updated = this.obtenerPorId(id_categoria);
    if (!updated) throw new Error('Categoría no encontrada.');
    return updated;
  },

  eliminar(id_categoria: number): { ok: boolean } {
    const db = getDatabase();
    const count = db
      .prepare('SELECT COUNT(*) AS total FROM productos WHERE id_categoria = ?')
      .get(id_categoria) as { total: number };
    if (count.total > 0) {
      throw new Error(
        `No se puede eliminar la categoría porque tiene ${count.total} producto(s) asociado(s).`
      );
    }
    const res = db.prepare('DELETE FROM categorias WHERE id_categoria = ?').run(id_categoria);
    if (Number(res.changes) === 0) throw new Error('Categoría no encontrada.');
    return { ok: true };
  },

  listarProductos(id_categoria: number) {
    const db = getDatabase();
    return db
      .prepare(`
        SELECT p.*, c.nombre AS categoria_nombre
        FROM productos p
        INNER JOIN categorias c ON c.id_categoria = p.id_categoria
        WHERE p.id_categoria = ?
        ORDER BY p.nombre ASC
      `)
      .all(id_categoria);
  },
};
