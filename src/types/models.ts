// ============================================================================
// SIGMAT - Modelos de Dominio (1:1 con Diagrama de Clases UML)
// Módulos: Inventario y Servicio Técnico
// ============================================================================

export type NombreRol = 'Administrador' | 'Mecánico' | 'Encargado de Almacén';

export type EstadoOrden = 'ABIERTA' | 'EN_PROCESO' | 'CERRADA';

export type TipoMovimiento = 'ENTRADA' | 'SALIDA';

export type EstadoAlerta = 'PENDIENTE' | 'RESUELTA';

export type TipoReporte =
  | 'INVENTARIO_GENERAL'
  | 'MOVIMIENTOS_INVENTARIO'
  | 'ORDENES_TRABAJO'
  | 'ALERTAS_STOCK';

export type ThemeMode = 'dark' | 'light';

// 1. Rol
export interface Rol {
  id_rol: number;
  nombre_rol: NombreRol | string;
  total_usuarios?: number;
}

// 2. Usuario
export interface Usuario {
  id_usuario: number;
  nombre: string;
  apellido: string;
  email: string;
  estado: boolean;
  id_rol: number;
  nombre_rol?: NombreRol | string;
}

// 3. Vehiculo
export interface Vehiculo {
  id_vehiculo: number;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  propietario_nombre: string;
  propietario_telefono: string;
  total_ordenes?: number;
}

// 4. Categoria
export interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion: string;
  total_productos?: number;
}

// 5. Producto
export interface Producto {
  id_producto: number;
  nombre: string;
  unidad_medida: string;
  precio_unitario: number;
  descripcion: string;
  stock_actual: number;
  nivel_minimo: number;
  id_categoria: number;
  categoria_nombre?: string;
  stock_bajo?: boolean;
}

// 6. OrdenTrabajo
export interface OrdenTrabajo {
  id_orden: number;
  fecha_ingreso: string;
  fecha_cierre: string | null;
  diagnostico: string;
  estado: EstadoOrden;
  id_mecanico: number;
  id_vehiculo: number;
  mecanico_nombre?: string;
  vehiculo_placa?: string;
  vehiculo_marca?: string;
  vehiculo_modelo?: string;
  vehiculo_anio?: number;
  propietario_nombre?: string;
  propietario_telefono?: string;
  total_repuestos?: number;
  cantidad_items?: number;
}

// 7. DetalleOrdenRepuesto
export interface DetalleOrdenRepuesto {
  id_detalle: number;
  cantidad: number;
  precio_unitario: number;
  id_orden: number;
  id_producto: number;
  producto_nombre?: string;
  unidad_medida?: string;
  subtotal: number;
}

// 8. MovimientoInventario
export interface MovimientoInventario {
  id_movimiento: number;
  tipo_movimiento: TipoMovimiento;
  cantidad: number;
  fecha: string;
  motivo: string;
  id_producto: number;
  id_usuario: number;
  id_orden: number | null;
  anulado?: boolean;
  producto_nombre?: string;
  unidad_medida?: string;
  usuario_nombre?: string;
  vehiculo_placa?: string | null;
}

// 9. AlertaStock
export interface AlertaStock {
  id_alerta: number;
  fecha_generada: string;
  estado: EstadoAlerta;
  id_producto: number;
  producto_nombre?: string;
  categoria_nombre?: string;
  stock_actual?: number;
  nivel_minimo?: number;
  unidad_medida?: string;
}

// 10. Reporte
export interface Reporte {
  id_reporte: number;
  tipo_reporte: TipoReporte | string;
  fecha_generacion: string;
  parametros: string;
  id_usuario: number;
  usuario_nombre?: string;
}

export interface ReporteGeneradoResponse {
  reporte: Reporte;
  titulo: string;
  columnas: string[];
  filas: Array<Record<string, string | number>>;
  resumen: Array<{ label: string; value: string }>;
}

export interface AsignacionRepuestoResult {
  detalle: DetalleOrdenRepuesto;
  movimiento: MovimientoInventario;
  producto: Producto;
  alertaGenerada: AlertaStock | null;
  totalOrden: number;
}

export interface DashboardResumen {
  totalProductos: number;
  valorInventario: number;
  alertasPendientes: number;
  ordenesAbiertas: number;
  ordenesCerradas: number;
  totalVehiculos: number;
  movimientosHoy: number;
  totalUsuariosActivos: number;
  tablasConteo: Array<{ tabla: string; entidad: string; registros: number }>;
}
