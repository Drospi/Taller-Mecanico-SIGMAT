import type { DatabaseSync } from 'node:sqlite';
import { hashPassword } from './password.ts';

/**
 * Pobla la base de datos SQLite con datos reales de un taller mecánico automotriz (SIGMAT)
 * respetando todas las claves foráneas y los 3 actores del Diagrama de Casos de Uso.
 */
export function seedDatabase(db: DatabaseSync): void {
  const existing = db.prepare('SELECT COUNT(*) as total FROM roles').get() as { total: number };
  if (existing.total > 0) {
    return;
  }

  db.exec('BEGIN IMMEDIATE');
  try {
    // 1. ROLES (3 actores del Diagrama de Casos de Uso)
    const insertRol = db.prepare('INSERT INTO roles (id_rol, nombre_rol) VALUES (?, ?)');
    insertRol.run(1, 'Administrador');
    insertRol.run(2, 'Mecánico');
    insertRol.run(3, 'Encargado de Almacén');

    // 2. USUARIOS (incluye usuarios de prueba por actor + personal adicional del taller)
    const insertUsuario = db.prepare(`
      INSERT INTO usuarios (id_usuario, nombre, apellido, email, password_hash, estado, id_rol)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertUsuario.run(1, 'Carlos', 'Mendoza', 'admin@sigmat.com', hashPassword('Admin123*'), 1, 1);
    insertUsuario.run(2, 'Diego', 'Rojas', 'mecanico@sigmat.com', hashPassword('Mecanico123*'), 1, 2);
    insertUsuario.run(3, 'Valeria', 'Quiroga', 'almacen@sigmat.com', hashPassword('Almacen123*'), 1, 3);
    insertUsuario.run(4, 'Javier', 'Torres', 'j.torres@sigmat.com', hashPassword('Mecanico123*'), 1, 2);
    insertUsuario.run(5, 'Mateo', 'Silva', 'm.silva@sigmat.com', hashPassword('Mecanico123*'), 1, 2);
    insertUsuario.run(6, 'Lucía', 'Paredes', 'l.paredes@sigmat.com', hashPassword('Almacen123*'), 0, 3);

    // 3. CATEGORIAS
    const insertCategoria = db.prepare(`
      INSERT INTO categorias (id_categoria, nombre, descripcion)
      VALUES (?, ?, ?)
    `);
    insertCategoria.run(1, 'Lubricantes y Fluidos', 'Aceites sintéticos, semisintéticos, refrigerantes y líquidos hidráulicos.');
    insertCategoria.run(2, 'Sistema de Frenos', 'Pastillas cerámicas, discos ventilados, zapatas y líquido DOT-4.');
    insertCategoria.run(3, 'Filtros y Admisión', 'Filtros de aceite, aire, combustible y cabina para vehículos livianos y 4x4.');
    insertCategoria.run(4, 'Suspensión y Dirección', 'Amortiguadores, rótulas, terminales, bujes y bieletas estabilizadoras.');
    insertCategoria.run(5, 'Sistema Eléctrico', 'Baterías 12V, bujías iridium, sensores MAF/O2, alternadores y fusibles.');
    insertCategoria.run(6, 'Motor y Transmisión', 'Correas de distribución, kits de embrague, empaquetaduras y bombas de agua.');

    // 4. PRODUCTOS (16 repuestos reales con precios y umbrales de stock mínimo)
    const insertProducto = db.prepare(`
      INSERT INTO productos (id_producto, nombre, unidad_medida, precio_unitario, descripcion, stock_actual, nivel_minimo, id_categoria)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertProducto.run(1, 'Aceite Sintético 5W-30 Castrol EDGE', 'Litro', 14.5, 'Lubricante sintético de alto rendimiento para motores gasolina y diésel ligero.', 36, 12, 1);
    insertProducto.run(2, 'Aceite Semisintético 10W-40 Mobil Super', 'Galón', 34.0, 'Protección antidesgaste para motores con más de 80.000 km.', 18, 6, 1);
    insertProducto.run(3, 'Refrigerante Orgánico Prestone 50/50', 'Galón', 18.75, 'Anticongelante y anticorrosivo listo para usar hasta 129°C.', 4, 6, 1); // BAJO STOCK
    insertProducto.run(4, 'Líquido de Frenos Bosch DOT-4 500ml', 'Unidad', 9.2, 'Fluido sintético de alto punto de ebullición para sistemas ABS/ESP.', 14, 5, 2);
    insertProducto.run(5, 'Pastillas de Freno Cerámicas Brembo Delanteras', 'Juego', 68.5, 'Juego de 4 pastillas cerámicas bajo ruido para SUV y camionetas Toyota/Nissan.', 3, 4, 2); // BAJO STOCK
    insertProducto.run(6, 'Disco de Freno Ventilado TRW 302mm', 'Unidad', 54.0, 'Disco delantero ventilado con recubrimiento anticorrosivo.', 10, 4, 2);
    insertProducto.run(7, 'Filtro de Aceite Bosch P3312', 'Unidad', 11.4, 'Elemento filtrante de alta retención con válvula antirretorno.', 25, 10, 3);
    insertProducto.run(8, 'Filtro de Aire Motor Mann C28125', 'Unidad', 16.8, 'Filtro de admisión de celulosa reforzada para Hilux y Frontier.', 7, 6, 3); // Cerca de mínimo (1 salida genera alerta!)
    insertProducto.run(9, 'Filtro de Combustible Diésel Sakurá', 'Unidad', 22.0, 'Separador de agua y micro-partículas para inyección Common Rail.', 9, 4, 3);
    insertProducto.run(10, 'Amortiguador Hidráulico Monroe OESpectrum', 'Unidad', 76.0, 'Amortiguador delantero de gas presurizado con control de rebote.', 6, 4, 4);
    insertProducto.run(11, 'Rótula de Suspensión Inferior 555 Japón', 'Unidad', 31.5, 'Rótula reforzada de acero forjado con guardapolvo de neopreno.', 2, 4, 4); // BAJO STOCK
    insertProducto.run(12, 'Bujía NGK Laser Iridium IX', 'Unidad', 15.25, 'Electrodo central de iridio de larga duración y encendido eficiente.', 28, 12, 5);
    insertProducto.run(13, 'Batería Moura 12V 75Ah Libre Mantenimiento', 'Unidad', 128.0, 'Batería sellada de alta corriente de arranque en frío (CCA 650A).', 5, 3, 5);
    insertProducto.run(14, 'Sensor de Flujo de Aire (MAF) Bosch', 'Unidad', 92.0, 'Sensor térmico digital OEM para lectura precisa de mezcla aire/combustible.', 4, 3, 5); // Cerca de mínimo
    insertProducto.run(15, 'Kit Correa de Distribución Gates PowerGrip', 'Kit', 115.0, 'Incluye correa reforzada, tensor automático y polea guía.', 5, 3, 6);
    insertProducto.run(16, 'Kit de Embrague LuK RepSet (Disco + Prensa + Collarín)', 'Kit', 245.0, 'Conjunto completo de embrague para camionetas 4x4 transmisión manual.', 3, 2, 6); // Cerca de mínimo

    // 5. VEHICULOS (8 vehículos clientes reales)
    const insertVehiculo = db.prepare(`
      INSERT INTO vehiculos (id_vehiculo, placa, marca, modelo, anio, propietario_nombre, propietario_telefono)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertVehiculo.run(1, '4821-LPX', 'Toyota', 'Hilux 2.8 SRV 4x4', 2021, 'Roberto Alarcón', '+591 71548290');
    insertVehiculo.run(2, '3190-SCZ', 'Nissan', 'Frontier NP300', 2020, 'Fernanda Camacho', '+591 76321904');
    insertVehiculo.run(3, '5542-CBB', 'Hyundai', 'Tucson GLS', 2022, 'Andrés Villarroel', '+591 70712543');
    insertVehiculo.run(4, '2984-LPZ', 'Suzuki', 'Grand Vitara', 2019, 'Paola Gutiérrez', '+591 72094411');
    insertVehiculo.run(5, '6107-SCZ', 'Mitsubishi', 'L200 Triton', 2023, 'Constructora Andina SRL', '+591 78051120');
    insertVehiculo.run(6, '4418-CBB', 'Chevrolet', 'Tracker Turbo', 2021, 'Marcelo Morales', '+591 71498832');
    insertVehiculo.run(7, '1875-LPZ', 'Kia', 'Sportage EX', 2018, 'Gabriela Salinas', '+591 73501299');
    insertVehiculo.run(8, '5093-SCZ', 'Ford', 'Ranger XLT 3.2', 2020, 'Logística Sur Ltda.', '+591 77643210');

    // 6. ORDENES DE TRABAJO (7 órdenes: ABIERTA, EN_PROCESO, CERRADA)
    const insertOrden = db.prepare(`
      INSERT INTO ordenes_trabajo (id_orden, fecha_ingreso, fecha_cierre, diagnostico, estado, id_mecanico, id_vehiculo)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertOrden.run(
      1,
      '2026-11-18 08:30:00',
      '2026-11-18 16:45:00',
      'Mantenimiento preventivo de 40.000 km: cambio de aceite sintético, filtro de aceite, filtro de aire y revisión de frenos.',
      'CERRADA',
      2,
      1
    );
    insertOrden.run(
      2,
      '2026-11-19 09:15:00',
      '2026-11-19 17:20:00',
      'Desgaste severo en pastillas delanteras y vibración al frenar. Reemplazo de pastillas cerámicas, discos ventilados y purga DOT-4.',
      'CERRADA',
      4,
      2
    );
    insertOrden.run(
      3,
      '2026-11-20 10:00:00',
      '2026-11-21 12:10:00',
      'Falla intermitente de encendido en ralentí y pérdida de potencia. Cambio de juego de bujías iridium y reemplazo de sensor MAF.',
      'CERRADA',
      2,
      3
    );
    insertOrden.run(
      4,
      '2026-11-21 14:20:00',
      null,
      'Golpeteo en tren delantero derecho al pasar baches. Diagnóstico de rótula inferior vencida y amortiguador delantero con fuga.',
      'EN_PROCESO',
      2,
      4
    );
    insertOrden.run(
      5,
      '2026-11-22 08:45:00',
      null,
      'Revisión preventiva de flota 60.000 km: cambio de aceite, filtro diésel, refrigerante orgánico y chequeo de correa de distribución.',
      'EN_PROCESO',
      4,
      5
    );
    insertOrden.run(
      6,
      '2026-11-23 08:10:00',
      null,
      'Cliente reporta dificultad de arranque en frío y testigo de batería encendido. Evaluar batería 12V y sistema de carga.',
      'ABIERTA',
      2,
      6
    );
    insertOrden.run(
      7,
      '2026-11-23 09:50:00',
      null,
      'Patinamiento de embrague en pendientes con carga y revisión general de fluidos de transmisión.',
      'ABIERTA',
      5,
      8
    );

    // 7. DETALLE ORDEN REPUESTO (12 detalles asignados a órdenes)
    const insertDetalle = db.prepare(`
      INSERT INTO detalle_orden_repuesto (id_detalle, cantidad, precio_unitario, id_orden, id_producto)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertDetalle.run(1, 6, 14.5, 1, 1);  // 6L Aceite 5W-30
    insertDetalle.run(2, 1, 11.4, 1, 7);  // 1 Filtro Aceite
    insertDetalle.run(3, 1, 16.8, 1, 8);  // 1 Filtro Aire
    insertDetalle.run(4, 1, 68.5, 2, 5);  // 1 Juego Pastillas Brembo
    insertDetalle.run(5, 2, 54.0, 2, 6);  // 2 Discos TRW
    insertDetalle.run(6, 2, 9.2, 2, 4);   // 2 Líquido DOT-4
    insertDetalle.run(7, 4, 15.25, 3, 12); // 4 Bujías Iridium
    insertDetalle.run(8, 1, 92.0, 3, 14); // 1 Sensor MAF
    insertDetalle.run(9, 2, 31.5, 4, 11); // 2 Rótulas 555
    insertDetalle.run(10, 2, 76.0, 4, 10); // 2 Amortiguadores Monroe
    insertDetalle.run(11, 2, 18.75, 5, 3); // 2 Refrigerante Prestone
    insertDetalle.run(12, 1, 22.0, 5, 9);  // 1 Filtro Diésel

    // 8. MOVIMIENTOS DE INVENTARIO (Entradas de proveedores + Salidas de órdenes)
    const insertMov = db.prepare(`
      INSERT INTO movimientos_inventario (id_movimiento, tipo_movimiento, cantidad, fecha, motivo, id_producto, id_usuario, id_orden, anulado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);
    insertMov.run(1, 'ENTRADA', 48, '2026-11-10 09:00:00', 'Compra mensual proveedor Lubricantes Andinos — Factura #8841', 1, 3, null);
    insertMov.run(2, 'ENTRADA', 24, '2026-11-10 09:15:00', 'Reposición de filtros Bosch — Orden de Compra #OC-104', 7, 3, null);
    insertMov.run(3, 'ENTRADA', 12, '2026-11-12 11:30:00', 'Ingreso discos de freno TRW — Importadora Central', 6, 3, null);
    insertMov.run(4, 'ENTRADA', 6, '2026-11-14 15:00:00', 'Compra kits de distribución Gates — Proveedor Automotriz', 15, 3, null);
    insertMov.run(5, 'ENTRADA', 8, '2026-11-15 10:20:00', 'Ingreso baterías Moura 75Ah — Lote Noviembre', 13, 3, null);
    insertMov.run(6, 'SALIDA', 6, '2026-11-18 10:15:00', 'Asignación de repuesto a Orden de Trabajo #1 (4821-LPX)', 1, 2, 1);
    insertMov.run(7, 'SALIDA', 1, '2026-11-18 10:18:00', 'Asignación de repuesto a Orden de Trabajo #1 (4821-LPX)', 7, 2, 1);
    insertMov.run(8, 'SALIDA', 1, '2026-11-18 10:20:00', 'Asignación de repuesto a Orden de Trabajo #1 (4821-LPX)', 8, 2, 1);
    insertMov.run(9, 'SALIDA', 1, '2026-11-19 11:05:00', 'Asignación de repuesto a Orden de Trabajo #2 (3190-SCZ)', 5, 4, 2);
    insertMov.run(10, 'SALIDA', 2, '2026-11-19 11:08:00', 'Asignación de repuesto a Orden de Trabajo #2 (3190-SCZ)', 6, 4, 2);
    insertMov.run(11, 'SALIDA', 2, '2026-11-19 11:12:00', 'Asignación de repuesto a Orden de Trabajo #2 (3190-SCZ)', 4, 4, 2);
    insertMov.run(12, 'SALIDA', 4, '2026-11-20 14:40:00', 'Asignación de repuesto a Orden de Trabajo #3 (5542-CBB)', 12, 2, 3);
    insertMov.run(13, 'SALIDA', 1, '2026-11-20 14:45:00', 'Asignación de repuesto a Orden de Trabajo #3 (5542-CBB)', 14, 2, 3);
    insertMov.run(14, 'SALIDA', 2, '2026-11-21 15:30:00', 'Asignación de repuesto a Orden de Trabajo #4 (2984-LPZ)', 11, 2, 4);
    insertMov.run(15, 'SALIDA', 2, '2026-11-21 15:35:00', 'Asignación de repuesto a Orden de Trabajo #4 (2984-LPZ)', 10, 2, 4);
    insertMov.run(16, 'SALIDA', 2, '2026-11-22 09:40:00', 'Asignación de repuesto a Orden de Trabajo #5 (6107-SCZ)', 3, 4, 5);
    insertMov.run(17, 'SALIDA', 1, '2026-11-22 09:45:00', 'Asignación de repuesto a Orden de Trabajo #5 (6107-SCZ)', 9, 4, 5);
    insertMov.run(18, 'ENTRADA', 10, '2026-11-22 16:10:00', 'Reposición de emergencia bujías NGK Laser Iridium', 12, 3, null);

    // 9. ALERTAS DE STOCK (3 pendientes de los productos bajo nivel mínimo + 1 resuelta)
    const insertAlerta = db.prepare(`
      INSERT INTO alertas_stock (id_alerta, fecha_generada, estado, id_producto)
      VALUES (?, ?, ?, ?)
    `);
    insertAlerta.run(1, '2026-11-19 11:05:01', 'PENDIENTE', 5);  // Pastillas Brembo (3 <= 4)
    insertAlerta.run(2, '2026-11-21 15:30:02', 'PENDIENTE', 11); // Rótula 555 (2 <= 4)
    insertAlerta.run(3, '2026-11-22 09:40:01', 'PENDIENTE', 3);  // Refrigerante Prestone (4 <= 6)
    insertAlerta.run(4, '2026-11-20 14:40:05', 'RESUELTA', 12);  // Bujía NGK (ya repuesta en mov #18)

    // 10. REPORTES (historial inicial de reportes generados)
    const insertReporte = db.prepare(`
      INSERT INTO reportes (id_reporte, tipo_reporte, fecha_generacion, parametros, id_usuario)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertReporte.run(1, 'INVENTARIO_GENERAL', '2026-11-20 18:00:00', JSON.stringify({ categoria: 'TODAS', soloStockBajo: false }), 1);
    insertReporte.run(2, 'MOVIMIENTOS_INVENTARIO', '2026-11-21 18:15:00', JSON.stringify({ tipo: 'TODOS', periodo: 'Noviembre 2026' }), 3);
    insertReporte.run(3, 'ORDENES_TRABAJO', '2026-11-22 17:45:00', JSON.stringify({ estado: 'TODOS' }), 1);
    insertReporte.run(4, 'ALERTAS_STOCK', '2026-11-23 08:00:00', JSON.stringify({ estado: 'PENDIENTE' }), 3);

    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
