import type { DatabaseSync } from 'node:sqlite';

/**
 * Esquema relacional SQLite 1:1 con el Diagrama de Clases UML de SIGMAT:
 * 1. roles                  (Rol)
 * 2. usuarios               (Usuario)
 * 3. vehiculos              (Vehiculo)
 * 4. categorias             (Categoria)
 * 5. productos              (Producto)
 * 6. ordenes_trabajo        (OrdenTrabajo)
 * 7. detalle_orden_repuesto (DetalleOrdenRepuesto)
 * 8. movimientos_inventario (MovimientoInventario)
 * 9. alertas_stock          (AlertaStock)
 * 10. reportes              (Reporte)
 */
export const SQL_SCHEMA = `
CREATE TABLE IF NOT EXISTS roles (
  id_rol INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_rol VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre VARCHAR(60) NOT NULL,
  apellido VARCHAR(60) NOT NULL,
  email VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  estado INTEGER NOT NULL DEFAULT 1 CHECK (estado IN (0, 1)),
  id_rol INTEGER NOT NULL,
  FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS vehiculos (
  id_vehiculo INTEGER PRIMARY KEY AUTOINCREMENT,
  placa VARCHAR(10) NOT NULL UNIQUE,
  marca VARCHAR(40) NOT NULL,
  modelo VARCHAR(40) NOT NULL,
  anio INTEGER NOT NULL CHECK (anio >= 1950 AND anio <= 2035),
  propietario_nombre VARCHAR(80) NOT NULL,
  propietario_telefono VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS categorias (
  id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(150) NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS productos (
  id_producto INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre VARCHAR(80) NOT NULL,
  unidad_medida VARCHAR(15) NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
  descripcion VARCHAR(200) NOT NULL DEFAULT '',
  stock_actual INTEGER NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
  nivel_minimo INTEGER NOT NULL DEFAULT 0 CHECK (nivel_minimo >= 0),
  id_categoria INTEGER NOT NULL,
  FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS ordenes_trabajo (
  id_orden INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha_ingreso DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre DATETIME NULL,
  diagnostico VARCHAR(250) NOT NULL,
  estado VARCHAR(15) NOT NULL DEFAULT 'ABIERTA' CHECK (estado IN ('ABIERTA', 'EN_PROCESO', 'CERRADA')),
  id_mecanico INTEGER NOT NULL,
  id_vehiculo INTEGER NOT NULL,
  FOREIGN KEY (id_mecanico) REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (id_vehiculo) REFERENCES vehiculos(id_vehiculo) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS detalle_orden_repuesto (
  id_detalle INTEGER PRIMARY KEY AUTOINCREMENT,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
  id_orden INTEGER NOT NULL,
  id_producto INTEGER NOT NULL,
  FOREIGN KEY (id_orden) REFERENCES ordenes_trabajo(id_orden) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id_movimiento INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo_movimiento VARCHAR(10) NOT NULL CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA')),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  motivo VARCHAR(150) NOT NULL,
  id_producto INTEGER NOT NULL,
  id_usuario INTEGER NOT NULL,
  id_orden INTEGER NULL,
  anulado INTEGER NOT NULL DEFAULT 0 CHECK (anulado IN (0, 1)),
  FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (id_orden) REFERENCES ordenes_trabajo(id_orden) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS alertas_stock (
  id_alerta INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha_generada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado VARCHAR(15) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'RESUELTA')),
  id_producto INTEGER NOT NULL,
  FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reportes (
  id_reporte INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo_reporte VARCHAR(50) NOT NULL,
  fecha_generacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  parametros VARCHAR(200) NOT NULL DEFAULT '{}',
  id_usuario INTEGER NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(id_rol);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(id_categoria);
CREATE INDEX IF NOT EXISTS idx_ordenes_mecanico ON ordenes_trabajo(id_mecanico);
CREATE INDEX IF NOT EXISTS idx_ordenes_vehiculo ON ordenes_trabajo(id_vehiculo);
CREATE INDEX IF NOT EXISTS idx_detalle_orden ON detalle_orden_repuesto(id_orden);
CREATE INDEX IF NOT EXISTS idx_detalle_producto ON detalle_orden_repuesto(id_producto);
CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON movimientos_inventario(id_producto);
CREATE INDEX IF NOT EXISTS idx_movimientos_orden ON movimientos_inventario(id_orden);
CREATE INDEX IF NOT EXISTS idx_alertas_producto_estado ON alertas_stock(id_producto, estado);
CREATE INDEX IF NOT EXISTS idx_reportes_usuario ON reportes(id_usuario);
`;

export function createSchema(db: DatabaseSync): void {
  db.exec(SQL_SCHEMA);
}
