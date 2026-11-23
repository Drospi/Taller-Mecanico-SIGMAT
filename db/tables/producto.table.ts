import type { DatabaseSync } from 'node:sqlite';
import { getDatabase } from '../connection.ts';

export interface ProductoRow {
  id_producto: number;
  nombre: string;
  unidad_medida: string;
  precio_unitario: number;
  descripcion: string;
  stock_actual: number;
  nivel_minimo: number;
  id_categoria: number;
  categoria_nombre: string;
  stock_bajo: boolean;
}

interface ProductoRawRow {
  id_producto: number;
  nombre: string;
  unidad_medida: string;
  precio_unitario: number;
  descripcion: string;
  stock_actual: number;
  nivel_minimo: number;
  id_categoria: number;
  categoria_nombre: string;
}

function mapProducto(row: ProductoRawRow): ProductoRow {
  const stock_actual = Number(row.stock_actual);
  const nivel_minimo = Number(row.nivel_minimo);
  return {
    id_producto: Number(row.id_producto),
    nombre: String(row.nombre),
    unidad_medida: String(row.unidad_medida),
    precio_unitario: Number(row.precio_unitario),
    descripcion: String(row.descripcion ?? ''),
    stock_actual,
    nivel_minimo,
    id_categoria: Number(row.id_categoria),
    categoria_nombre: String(row.categoria_nombre),
    stock_bajo: stock_actual <= nivel_minimo,
  };
}

export const ProductoTable = {
  listar(): ProductoRow[] {
    const db = getDatabase();
    const rows = db
      .prepare(`
        SELECT p.*, c.nombre AS categoria_nombre
        FROM productos p
        INNER JOIN categorias c ON c.id_categoria = p.id_categoria
        ORDER BY p.id_producto ASC
      `)
      .all() as unknown as ProductoRawRow[];
    return rows.map(mapProducto);
  },

  obtenerPorId(id_producto: number, txDb?: DatabaseSync): ProductoRow | null {
    const db = txDb ?? getDatabase();
    const row = db
      .prepare(`
        SELECT p.*, c.nombre AS categoria_nombre
        FROM productos p
        INNER JOIN categorias c ON c.id_categoria = p.id_categoria
        WHERE p.id_producto = ?
      `)
      .get(id_producto) as unknown as ProductoRawRow | undefined;
    return row ? mapProducto(row) : null;
  },

  registrar(data: {
    nombre: string;
    unidad_medida: string;
    precio_unitario: number;
    descripcion: string;
    stock_actual: number;
    nivel_minimo: number;
    id_categoria: number;
  }): ProductoRow {
    const db = getDatabase();
    if (!data.nombre.trim()) throw new Error('El nombre del producto es obligatorio.');
    if (data.precio_unitario < 0) throw new Error('El precio unitario no puede ser negativo.');
    if (data.stock_actual < 0 || data.nivel_minimo < 0) {
      throw new Error('El stock y el nivel mínimo deben ser mayores o iguales a 0.');
    }

    const info = db
      .prepare(`
        INSERT INTO productos (nombre, unidad_medida, precio_unitario, descripcion, stock_actual, nivel_minimo, id_categoria)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        data.nombre.trim(),
        data.unidad_medida.trim(),
        Number(data.precio_unitario),
        data.descripcion.trim(),
        Math.floor(Number(data.stock_actual)),
        Math.floor(Number(data.nivel_minimo)),
        Number(data.id_categoria)
      );

    const created = this.obtenerPorId(Number(info.lastInsertRowid));
    if (!created) throw new Error('No se pudo registrar el producto.');
    return created;
  },

  editar(
    id_producto: number,
    data: {
      nombre: string;
      unidad_medida: string;
      precio_unitario: number;
      descripcion: string;
      stock_actual: number;
      nivel_minimo: number;
      id_categoria: number;
    }
  ): ProductoRow {
    const db = getDatabase();
    if (!data.nombre.trim()) throw new Error('El nombre del producto es obligatorio.');
    db.prepare(`
      UPDATE productos
      SET nombre = ?, unidad_medida = ?, precio_unitario = ?, descripcion = ?, stock_actual = ?, nivel_minimo = ?, id_categoria = ?
      WHERE id_producto = ?
    `).run(
      data.nombre.trim(),
      data.unidad_medida.trim(),
      Number(data.precio_unitario),
      data.descripcion.trim(),
      Math.floor(Number(data.stock_actual)),
      Math.floor(Number(data.nivel_minimo)),
      Number(data.id_categoria),
      id_producto
    );

    const updated = this.obtenerPorId(id_producto);
    if (!updated) throw new Error('Producto no encontrado.');
    return updated;
  },

  eliminar(id_producto: number): { ok: boolean } {
    const db = getDatabase();
    const inOrders = db
      .prepare('SELECT COUNT(*) AS total FROM detalle_orden_repuesto WHERE id_producto = ?')
      .get(id_producto) as { total: number };
    const inMoves = db
      .prepare('SELECT COUNT(*) AS total FROM movimientos_inventario WHERE id_producto = ?')
      .get(id_producto) as { total: number };

    if (inOrders.total > 0 || inMoves.total > 0) {
      throw new Error(
        'No se puede eliminar este producto porque posee historial en órdenes de trabajo o movimientos de inventario.'
      );
    }

    const res = db.prepare('DELETE FROM productos WHERE id_producto = ?').run(id_producto);
    if (Number(res.changes) === 0) throw new Error('Producto no encontrado.');
    return { ok: true };
  },

  /**
   * Método del Diagrama de Clases: +actualizarStock(cantidad, tipoMovimiento)
   */
  actualizarStock(
    id_producto: number,
    cantidad: number,
    tipoMovimiento: 'ENTRADA' | 'SALIDA',
    txDb?: DatabaseSync
  ): ProductoRow {
    const db = txDb ?? getDatabase();
    const producto = this.obtenerPorId(id_producto, db);
    if (!producto) throw new Error('Producto no encontrado.');
    if (cantidad <= 0) throw new Error('La cantidad debe ser mayor a cero.');

    const nuevoStock =
      tipoMovimiento === 'ENTRADA'
        ? producto.stock_actual + cantidad
        : producto.stock_actual - cantidad;

    if (nuevoStock < 0) {
      throw new Error(
        `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock_actual} ${producto.unidad_medida}(s), solicitado: ${cantidad}.`
      );
    }

    db.prepare('UPDATE productos SET stock_actual = ? WHERE id_producto = ?').run(
      nuevoStock,
      id_producto
    );

    const updated = this.obtenerPorId(id_producto, db);
    if (!updated) throw new Error('Error al actualizar stock del producto.');
    return updated;
  },

  /**
   * Método del Diagrama de Clases: +verificarStockMinimo() : boolean
   */
  verificarStockMinimo(id_producto: number, txDb?: DatabaseSync): boolean {
    const producto = this.obtenerPorId(id_producto, txDb);
    if (!producto) return false;
    return producto.stock_actual <= producto.nivel_minimo;
  },
};
