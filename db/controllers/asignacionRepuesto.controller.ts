import { runInTransaction } from '../connection.ts';
import { OrdenTrabajoTable } from '../tables/ordenTrabajo.table.ts';
import { ProductoTable, type ProductoRow } from '../tables/producto.table.ts';
import { DetalleOrdenRepuestoTable, type DetalleOrdenRepuestoRow } from '../tables/detalleOrdenRepuesto.table.ts';
import { MovimientoInventarioTable, type MovimientoInventarioRow } from '../tables/movimientoInventario.table.ts';
import type { AlertaStockRow } from '../tables/alertaStock.table.ts';
import { ControladorAlertaStock } from './alertaStock.controller.ts';

export interface AsignacionResult {
  detalle: DetalleOrdenRepuestoRow;
  movimiento: MovimientoInventarioRow;
  producto: ProductoRow;
  alertaGenerada: AlertaStockRow | null;
  totalOrden: number;
}

/**
 * ControladorAsignacionRepuesto (Diagrama de Robustez & Diagrama de Actividades)
 * Ejecuta atómicamente los 6 pasos exactos en SQLite:
 * 1. Obtener detalles de la orden (OrdenTrabajo)
 * 2. Consultar stock disponible (Producto) -> validar stock_actual >= cantidad
 * 3. Registrar detalle del repuesto (DetalleOrdenRepuesto)
 * 4. Registrar salida de inventario (MovimientoInventario) + Actualizar stock (Producto)
 * 5. Verificar stock mínimo (ControladorAlertaStock)
 * 6. Generar alerta de stock si corresponde (AlertaStock)
 */
export const ControladorAsignacionRepuesto = {
  asignarRepuestoAOrden(params: {
    id_orden: number;
    id_producto: number;
    cantidad: number;
    id_usuario: number;
    motivo?: string;
  }): AsignacionResult {
    const cantidad = Math.floor(Number(params.cantidad));
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      throw new Error('La cantidad requerida debe ser un número entero mayor a 0.');
    }

    return runInTransaction((txDb) => {
      // Paso 1: Obtener detalles de la orden
      const orden = OrdenTrabajoTable.obtenerPorId(params.id_orden, txDb);
      if (!orden) {
        throw new Error(`No existe la Orden de Trabajo #${params.id_orden}.`);
      }
      if (orden.estado === 'CERRADA') {
        throw new Error(`La Orden de Trabajo #${orden.id_orden} ya está CERRADA y no admite más repuestos.`);
      }

      // Paso 2: Consultar stock_actual del producto
      const producto = ProductoTable.obtenerPorId(params.id_producto, txDb);
      if (!producto) {
        throw new Error('El repuesto seleccionado no existe en el catálogo.');
      }
      if (producto.stock_actual < cantidad) {
        throw new Error(
          `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock_actual} ${producto.unidad_medida}(s), solicitado: ${cantidad}.`
        );
      }

      // Paso 3: Registrar detalle orden-repuesto
      const detalle = DetalleOrdenRepuestoTable.registrar(
        {
          id_orden: orden.id_orden,
          id_producto: producto.id_producto,
          cantidad,
          precio_unitario: producto.precio_unitario,
        },
        txDb
      );

      // Si la orden estaba ABIERTA, pasa a EN_PROCESO
      if (orden.estado === 'ABIERTA') {
        txDb
          .prepare(`UPDATE ordenes_trabajo SET estado = 'EN_PROCESO' WHERE id_orden = ?`)
          .run(orden.id_orden);
      }

      // Paso 4a: Registrar movimiento de salida de inventario
      const motivoFinal =
        params.motivo?.trim() ||
        `Asignación de repuesto a Orden de Trabajo #${orden.id_orden} (${orden.vehiculo_placa})`;

      const movimiento = MovimientoInventarioTable.registrarSalida(
        {
          id_producto: producto.id_producto,
          cantidad,
          motivo: motivoFinal,
          id_usuario: params.id_usuario,
          id_orden: orden.id_orden,
        },
        txDb
      );

      // Paso 4b: Actualizar stock_actual del producto
      const productoActualizado = ProductoTable.actualizarStock(
        producto.id_producto,
        cantidad,
        'SALIDA',
        txDb
      );

      // Paso 5 y 6: Verificar stock mínimo y generar alerta si corresponde
      const alertaGenerada = ControladorAlertaStock.verificarYGenerarAlerta(
        productoActualizado.id_producto,
        txDb
      );

      const totalOrden = OrdenTrabajoTable.calcularTotalRepuestos(orden.id_orden, txDb);

      return {
        detalle,
        movimiento,
        producto: productoActualizado,
        alertaGenerada,
        totalOrden,
      };
    });
  },
};
