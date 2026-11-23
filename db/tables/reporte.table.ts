import { getDatabase } from '../connection.ts';
import { ProductoTable } from './producto.table.ts';
import { MovimientoInventarioTable } from './movimientoInventario.table.ts';
import { OrdenTrabajoTable } from './ordenTrabajo.table.ts';
import { AlertaStockTable } from './alertaStock.table.ts';

export interface ReporteRow {
  id_reporte: number;
  tipo_reporte: string;
  fecha_generacion: string;
  parametros: string;
  id_usuario: number;
  usuario_nombre: string;
}

export interface ReportePayload {
  reporte: ReporteRow;
  titulo: string;
  columnas: string[];
  filas: Array<Record<string, string | number>>;
  resumen: Array<{ label: string; value: string }>;
}

export const ReporteTable = {
  listar(): ReporteRow[] {
    const db = getDatabase();
    return db
      .prepare(`
        SELECT r.*, (u.nombre || ' ' || u.apellido) AS usuario_nombre
        FROM reportes r
        INNER JOIN usuarios u ON u.id_usuario = r.id_usuario
        ORDER BY r.id_reporte DESC
      `)
      .all() as unknown as ReporteRow[];
  },

  obtenerPorId(id_reporte: number): ReporteRow | null {
    const db = getDatabase();
    const row = db
      .prepare(`
        SELECT r.*, (u.nombre || ' ' || u.apellido) AS usuario_nombre
        FROM reportes r
        INNER JOIN usuarios u ON u.id_usuario = r.id_usuario
        WHERE r.id_reporte = ?
      `)
      .get(id_reporte) as unknown as ReporteRow | undefined;
    return row ?? null;
  },

  /**
   * +generar() -> guarda el registro en SQLite y retorna los datos tabulares listos para PDF/Excel
   */
  generar(data: {
    tipo_reporte: string;
    parametros: Record<string, unknown>;
    id_usuario: number;
  }): ReportePayload {
    const db = getDatabase();
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const parametrosStr = JSON.stringify(data.parametros ?? {}).slice(0, 200);
    const info = db
      .prepare(`
        INSERT INTO reportes (tipo_reporte, fecha_generacion, parametros, id_usuario)
        VALUES (?, ?, ?, ?)
      `)
      .run(data.tipo_reporte, now, parametrosStr, data.id_usuario);

    const reporte = this.obtenerPorId(Number(info.lastInsertRowid))!;
    return this.construirDatosReporte(reporte);
  },

  construirDatosReporte(reporte: ReporteRow): ReportePayload {
    let params: Record<string, unknown> = {};
    try {
      params = JSON.parse(reporte.parametros || '{}') as Record<string, unknown>;
    } catch {
      params = {};
    }

    switch (reporte.tipo_reporte) {
      case 'INVENTARIO_GENERAL': {
        let productos = ProductoTable.listar();
        if (params.soloStockBajo === true) {
          productos = productos.filter((p) => p.stock_bajo);
        }
        if (typeof params.id_categoria === 'number' && params.id_categoria > 0) {
          productos = productos.filter((p) => p.id_categoria === params.id_categoria);
        }
        const valorTotal = productos.reduce((acc, p) => acc + p.stock_actual * p.precio_unitario, 0);
        const bajos = productos.filter((p) => p.stock_bajo).length;
        return {
          reporte,
          titulo: 'Reporte de Inventario General y Valorización',
          columnas: ['ID', 'Producto', 'Categoría', 'Unidad', 'Stock Actual', 'Nivel Mínimo', 'Precio Unit. ($)', 'Valor Total ($)', 'Estado'],
          filas: productos.map((p) => ({
            ID: p.id_producto,
            Producto: p.nombre,
            Categoría: p.categoria_nombre,
            Unidad: p.unidad_medida,
            'Stock Actual': p.stock_actual,
            'Nivel Mínimo': p.nivel_minimo,
            'Precio Unit. ($)': Number(p.precio_unitario.toFixed(2)),
            'Valor Total ($)': Number((p.stock_actual * p.precio_unitario).toFixed(2)),
            Estado: p.stock_bajo ? 'STOCK BAJO' : 'ÓPTIMO',
          })),
          resumen: [
            { label: 'Productos listados', value: String(productos.length) },
            { label: 'En alerta stock mínimo', value: String(bajos) },
            { label: 'Valorización total', value: `$${valorTotal.toFixed(2)}` },
          ],
        };
      }

      case 'MOVIMIENTOS_INVENTARIO': {
        const tipo = typeof params.tipo === 'string' ? params.tipo : 'TODOS';
        const movs = MovimientoInventarioTable.listar({ tipo_movimiento: tipo });
        const entradas = movs.filter((m) => m.tipo_movimiento === 'ENTRADA' && !m.anulado).reduce((a, m) => a + m.cantidad, 0);
        const salidas = movs.filter((m) => m.tipo_movimiento === 'SALIDA' && !m.anulado).reduce((a, m) => a + m.cantidad, 0);
        return {
          reporte,
          titulo: 'Reporte de Movimientos de Inventario (Kardex)',
          columnas: ['ID', 'Fecha', 'Tipo', 'Producto', 'Cantidad', 'Orden', 'Responsable', 'Motivo', 'Estado'],
          filas: movs.map((m) => ({
            ID: m.id_movimiento,
            Fecha: m.fecha,
            Tipo: m.tipo_movimiento,
            Producto: m.producto_nombre,
            Cantidad: m.cantidad,
            Orden: m.id_orden ? `OT-#${m.id_orden}` : 'N/A',
            Responsable: m.usuario_nombre,
            Motivo: m.motivo,
            Estado: m.anulado ? 'ANULADO' : 'VIGENTE',
          })),
          resumen: [
            { label: 'Movimientos registrados', value: String(movs.length) },
            { label: 'Unidades ingresadas', value: `+${entradas}` },
            { label: 'Unidades despachadas', value: `-${salidas}` },
          ],
        };
      }

      case 'ORDENES_TRABAJO': {
        const estado = typeof params.estado === 'string' ? params.estado : 'TODOS';
        const ordenes = OrdenTrabajoTable.listar({ estado });
        const facturado = ordenes.reduce((acc, o) => acc + Number(o.total_repuestos), 0);
        return {
          reporte,
          titulo: 'Reporte de Órdenes de Trabajo — Servicio Técnico',
          columnas: ['Orden', 'Ingreso', 'Cierre', 'Placa', 'Vehículo', 'Propietario', 'Mecánico', 'Estado', 'Total Repuestos ($)'],
          filas: ordenes.map((o) => ({
            Orden: `OT-#${o.id_orden}`,
            Ingreso: o.fecha_ingreso,
            Cierre: o.fecha_cierre ?? 'En curso',
            Placa: o.vehiculo_placa,
            Vehículo: `${o.vehiculo_marca} ${o.vehiculo_modelo} (${o.vehiculo_anio})`,
            Propietario: o.propietario_nombre,
            Mecánico: o.mecanico_nombre,
            Estado: o.estado,
            'Total Repuestos ($)': Number(Number(o.total_repuestos).toFixed(2)),
          })),
          resumen: [
            { label: 'Total órdenes', value: String(ordenes.length) },
            { label: 'Abiertas / En proceso', value: String(ordenes.filter((o) => o.estado !== 'CERRADA').length) },
            { label: 'Total en repuestos', value: `$${facturado.toFixed(2)}` },
          ],
        };
      }

      case 'ALERTAS_STOCK':
      default: {
        const estadoFiltro = typeof params.estado === 'string' ? params.estado : 'TODOS';
        let alertas = AlertaStockTable.listarTodas();
        if (estadoFiltro !== 'TODOS') {
          alertas = alertas.filter((a) => a.estado === estadoFiltro);
        }
        return {
          reporte,
          titulo: 'Reporte de Alertas de Stock Mínimo',
          columnas: ['ID Alerta', 'Fecha Generada', 'Producto', 'Categoría', 'Stock Actual', 'Nivel Mínimo', 'Déficit', 'Estado'],
          filas: alertas.map((a) => ({
            'ID Alerta': a.id_alerta,
            'Fecha Generada': a.fecha_generada,
            Producto: a.producto_nombre,
            Categoría: a.categoria_nombre,
            'Stock Actual': a.stock_actual,
            'Nivel Mínimo': a.nivel_minimo,
            Déficit: Math.max(0, a.nivel_minimo - a.stock_actual),
            Estado: a.estado,
          })),
          resumen: [
            { label: 'Total alertas', value: String(alertas.length) },
            { label: 'Pendientes', value: String(alertas.filter((a) => a.estado === 'PENDIENTE').length) },
            { label: 'Resueltas', value: String(alertas.filter((a) => a.estado === 'RESUELTA').length) },
          ],
        };
      }
    }
  },
};
