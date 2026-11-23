export interface TableSchemaDescriptor {
  tableName: string;
  className: string;
  fileName: string;
  module: 'Seguridad' | 'Inventario' | 'Servicio Técnico' | 'Reportes';
  primaryKey: string;
  foreignKeys: string[];
  columns: string[];
  methods: string[];
}

export const DB_SCHEMA_METADATA: TableSchemaDescriptor[] = [
  {
    tableName: 'roles',
    className: 'Rol',
    fileName: 'db/tables/rol.table.ts',
    module: 'Seguridad',
    primaryKey: 'id_rol',
    foreignKeys: [],
    columns: ['id_rol', 'nombre_rol'],
    methods: ['registrar()', 'editar()', 'listarUsuarios()'],
  },
  {
    tableName: 'usuarios',
    className: 'Usuario',
    fileName: 'db/tables/usuario.table.ts',
    module: 'Seguridad',
    primaryKey: 'id_usuario',
    foreignKeys: ['id_rol -> roles.id_rol'],
    columns: ['id_usuario', 'nombre', 'apellido', 'email', 'password_hash', 'estado', 'id_rol'],
    methods: ['iniciarSesion()', 'cerrarSesion()', 'cambiarPassword()', 'registrar()', 'editar()'],
  },
  {
    tableName: 'vehiculos',
    className: 'Vehiculo',
    fileName: 'db/tables/vehiculo.table.ts',
    module: 'Servicio Técnico',
    primaryKey: 'id_vehiculo',
    foreignKeys: [],
    columns: ['id_vehiculo', 'placa', 'marca', 'modelo', 'anio', 'propietario_nombre', 'propietario_telefono'],
    methods: ['registrar()', 'editar()', 'consultarHistorialOrdenes()'],
  },
  {
    tableName: 'categorias',
    className: 'Categoria',
    fileName: 'db/tables/categoria.table.ts',
    module: 'Inventario',
    primaryKey: 'id_categoria',
    foreignKeys: [],
    columns: ['id_categoria', 'nombre', 'descripcion'],
    methods: ['registrar()', 'editar()', 'eliminar()', 'listarProductos()'],
  },
  {
    tableName: 'productos',
    className: 'Producto',
    fileName: 'db/tables/producto.table.ts',
    module: 'Inventario',
    primaryKey: 'id_producto',
    foreignKeys: ['id_categoria -> categorias.id_categoria'],
    columns: [
      'id_producto',
      'nombre',
      'unidad_medida',
      'precio_unitario',
      'descripcion',
      'stock_actual',
      'nivel_minimo',
      'id_categoria',
    ],
    methods: ['registrar()', 'editar()', 'eliminar()', 'actualizarStock()', 'verificarStockMinimo()'],
  },
  {
    tableName: 'ordenes_trabajo',
    className: 'OrdenTrabajo',
    fileName: 'db/tables/ordenTrabajo.table.ts',
    module: 'Servicio Técnico',
    primaryKey: 'id_orden',
    foreignKeys: ['id_mecanico -> usuarios.id_usuario', 'id_vehiculo -> vehiculos.id_vehiculo'],
    columns: ['id_orden', 'fecha_ingreso', 'fecha_cierre', 'diagnostico', 'estado', 'id_mecanico', 'id_vehiculo'],
    methods: ['abrir()', 'registrarDiagnostico()', 'cerrar()', 'calcularTotalRepuestos()', 'listarRepuestosAsignados()'],
  },
  {
    tableName: 'detalle_orden_repuesto',
    className: 'DetalleOrdenRepuesto',
    fileName: 'db/tables/detalleOrdenRepuesto.table.ts',
    module: 'Servicio Técnico',
    primaryKey: 'id_detalle',
    foreignKeys: ['id_orden -> ordenes_trabajo.id_orden', 'id_producto -> productos.id_producto'],
    columns: ['id_detalle', 'cantidad', 'precio_unitario', 'id_orden', 'id_producto'],
    methods: ['calcularSubtotal()', 'actualizarCantidad()'],
  },
  {
    tableName: 'movimientos_inventario',
    className: 'MovimientoInventario',
    fileName: 'db/tables/movimientoInventario.table.ts',
    module: 'Inventario',
    primaryKey: 'id_movimiento',
    foreignKeys: [
      'id_producto -> productos.id_producto',
      'id_usuario -> usuarios.id_usuario',
      'id_orden -> ordenes_trabajo.id_orden (nullable)',
    ],
    columns: ['id_movimiento', 'tipo_movimiento', 'cantidad', 'fecha', 'motivo', 'id_producto', 'id_usuario', 'id_orden'],
    methods: ['registrarEntrada()', 'registrarSalida()', 'anular()'],
  },
  {
    tableName: 'alertas_stock',
    className: 'AlertaStock',
    fileName: 'db/tables/alertaStock.table.ts',
    module: 'Inventario',
    primaryKey: 'id_alerta',
    foreignKeys: ['id_producto -> productos.id_producto'],
    columns: ['id_alerta', 'fecha_generada', 'estado', 'id_producto'],
    methods: ['generar()', 'resolver()', 'listarPendientes()'],
  },
  {
    tableName: 'reportes',
    className: 'Reporte',
    fileName: 'db/tables/reporte.table.ts',
    module: 'Reportes',
    primaryKey: 'id_reporte',
    foreignKeys: ['id_usuario -> usuarios.id_usuario'],
    columns: ['id_reporte', 'tipo_reporte', 'fecha_generacion', 'parametros', 'id_usuario'],
    methods: ['generar()', 'exportarPDF()', 'exportarExcel()'],
  },
];
