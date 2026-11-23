import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export const DB_CONFIG = {
  directory: currentDir,
  fileName: 'sigmat.sqlite',
  filePath: path.join(currentDir, 'sigmat.sqlite'),
  pragmas: [
    'PRAGMA foreign_keys = ON;',
    'PRAGMA journal_mode = WAL;',
    'PRAGMA synchronous = NORMAL;',
    'PRAGMA busy_timeout = 5000;',
  ],
  tables: {
    roles: 'roles',
    usuarios: 'usuarios',
    vehiculos: 'vehiculos',
    categorias: 'categorias',
    productos: 'productos',
    ordenesTrabajo: 'ordenes_trabajo',
    detalleOrdenRepuesto: 'detalle_orden_repuesto',
    movimientosInventario: 'movimientos_inventario',
    alertasStock: 'alertas_stock',
    reportes: 'reportes',
  },
} as const;
