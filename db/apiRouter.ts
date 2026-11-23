import type { IncomingMessage, ServerResponse } from 'node:http';
import { getDatabase } from './connection.ts';
import {
  RolTable,
  UsuarioTable,
  VehiculoTable,
  CategoriaTable,
  ProductoTable,
  OrdenTrabajoTable,
  MovimientoInventarioTable,
  AlertaStockTable,
  ReporteTable,
} from './tables/index.ts';
import { ControladorAlertaStock } from './controllers/alertaStock.controller.ts';
import { ControladorAsignacionRepuesto } from './controllers/asignacionRepuesto.controller.ts';
import { ControladorInventario } from './controllers/inventario.controller.ts';

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf-8').trim();
  if (!raw) return {};
  return JSON.parse(raw) as Record<string, unknown>;
}

function getActorUserId(req: IncomingMessage, fallback?: unknown): number {
  const headerVal = req.headers['x-sigmat-user-id'];
  if (typeof headerVal === 'string' && Number(headerVal) > 0) {
    return Number(headerVal);
  }
  if (typeof fallback === 'number' && fallback > 0) {
    return fallback;
  }
  return 1;
}

function getDashboardResumen() {
  const db = getDatabase();
  const productos = ProductoTable.listar();
  const valorInventario = productos.reduce((acc, p) => acc + p.stock_actual * p.precio_unitario, 0);
  const alertasPendientes = AlertaStockTable.listarPendientes().length;
  const ordenes = OrdenTrabajoTable.listar();
  const ordenesAbiertas = ordenes.filter((o) => o.estado !== 'CERRADA').length;
  const ordenesCerradas = ordenes.filter((o) => o.estado === 'CERRADA').length;
  const totalVehiculos = (db.prepare('SELECT COUNT(*) AS c FROM vehiculos').get() as { c: number }).c;
  const totalUsuariosActivos = (
    db.prepare('SELECT COUNT(*) AS c FROM usuarios WHERE estado = 1').get() as { c: number }
  ).c;
  const todayPrefix = new Date().toISOString().slice(0, 10);
  const movimientosHoy = (
    db
      .prepare("SELECT COUNT(*) AS c FROM movimientos_inventario WHERE fecha LIKE ? AND anulado = 0")
      .get(`${todayPrefix}%`) as { c: number }
  ).c;

  const tablesSpec = [
    { tabla: 'roles', entidad: 'Rol' },
    { tabla: 'usuarios', entidad: 'Usuario' },
    { tabla: 'vehiculos', entidad: 'Vehiculo' },
    { tabla: 'categorias', entidad: 'Categoria' },
    { tabla: 'productos', entidad: 'Producto' },
    { tabla: 'ordenes_trabajo', entidad: 'OrdenTrabajo' },
    { tabla: 'detalle_orden_repuesto', entidad: 'DetalleOrdenRepuesto' },
    { tabla: 'movimientos_inventario', entidad: 'MovimientoInventario' },
    { tabla: 'alertas_stock', entidad: 'AlertaStock' },
    { tabla: 'reportes', entidad: 'Reporte' },
  ];

  const tablasConteo = tablesSpec.map((t) => ({
    tabla: t.tabla,
    entidad: t.entidad,
    registros: (db.prepare(`SELECT COUNT(*) AS c FROM ${t.tabla}`).get() as { c: number }).c,
  }));

  return {
    totalProductos: productos.length,
    valorInventario: Number(valorInventario.toFixed(2)),
    alertasPendientes,
    ordenesAbiertas,
    ordenesCerradas,
    totalVehiculos,
    movimientosHoy,
    totalUsuariosActivos,
    tablasConteo,
  };
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const urlString = req.url ?? '/';
  if (!urlString.startsWith('/api')) {
    return false;
  }

  // Asegura conexión inicializada y base de datos SQLite sembrada
  getDatabase();

  const url = new URL(urlString, 'http://localhost');
  const pathname = url.pathname.replace(/\/+$/, '');
  const method = (req.method ?? 'GET').toUpperCase();

  try {
    // ------------------------------------------------------------------ AUTH
    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await readJsonBody(req);
      const user = UsuarioTable.iniciarSesion(String(body.email ?? ''), String(body.password ?? ''));
      sendJson(res, 200, { usuario: user });
      return true;
    }

    if (pathname === '/api/auth/logout' && method === 'POST') {
      sendJson(res, 200, UsuarioTable.cerrarSesion());
      return true;
    }

    if (pathname === '/api/auth/change-password' && method === 'POST') {
      const body = await readJsonBody(req);
      const id = getActorUserId(req, body.id_usuario);
      sendJson(res, 200, UsuarioTable.cambiarPassword(id, String(body.nuevaPassword ?? '')));
      return true;
    }

    // ------------------------------------------------------------- DASHBOARD
    if (pathname === '/api/dashboard' && method === 'GET') {
      sendJson(res, 200, getDashboardResumen());
      return true;
    }

    // ----------------------------------------------------------------- ROLES
    if (pathname === '/api/roles' && method === 'GET') {
      sendJson(res, 200, RolTable.listar());
      return true;
    }
    if (pathname === '/api/roles' && method === 'POST') {
      const body = await readJsonBody(req);
      sendJson(res, 201, RolTable.registrar(String(body.nombre_rol ?? '')));
      return true;
    }
    const rolUsersMatch = pathname.match(/^\/api\/roles\/(\d+)\/usuarios$/);
    if (rolUsersMatch && method === 'GET') {
      sendJson(res, 200, RolTable.listarUsuarios(Number(rolUsersMatch[1])));
      return true;
    }
    const rolIdMatch = pathname.match(/^\/api\/roles\/(\d+)$/);
    if (rolIdMatch && method === 'PUT') {
      const body = await readJsonBody(req);
      sendJson(res, 200, RolTable.editar(Number(rolIdMatch[1]), String(body.nombre_rol ?? '')));
      return true;
    }

    // -------------------------------------------------------------- USUARIOS
    if (pathname === '/api/usuarios' && method === 'GET') {
      sendJson(res, 200, UsuarioTable.listar());
      return true;
    }
    if (pathname === '/api/usuarios' && method === 'POST') {
      const body = await readJsonBody(req);
      const created = UsuarioTable.registrar({
        nombre: String(body.nombre ?? ''),
        apellido: String(body.apellido ?? ''),
        email: String(body.email ?? ''),
        password: String(body.password ?? ''),
        id_rol: Number(body.id_rol),
        estado: body.estado !== false,
      });
      sendJson(res, 201, created);
      return true;
    }
    const userEstadoMatch = pathname.match(/^\/api\/usuarios\/(\d+)\/estado$/);
    if (userEstadoMatch && method === 'PATCH') {
      const body = await readJsonBody(req);
      sendJson(res, 200, UsuarioTable.cambiarEstado(Number(userEstadoMatch[1]), Boolean(body.estado)));
      return true;
    }
    const userPassMatch = pathname.match(/^\/api\/usuarios\/(\d+)\/password$/);
    if (userPassMatch && method === 'PATCH') {
      const body = await readJsonBody(req);
      sendJson(res, 200, UsuarioTable.cambiarPassword(Number(userPassMatch[1]), String(body.password ?? '')));
      return true;
    }
    const userIdMatch = pathname.match(/^\/api\/usuarios\/(\d+)$/);
    if (userIdMatch && method === 'PUT') {
      const body = await readJsonBody(req);
      const updated = UsuarioTable.editar(Number(userIdMatch[1]), {
        nombre: String(body.nombre ?? ''),
        apellido: String(body.apellido ?? ''),
        email: String(body.email ?? ''),
        id_rol: Number(body.id_rol),
        estado: Boolean(body.estado),
      });
      sendJson(res, 200, updated);
      return true;
    }

    // ------------------------------------------------------------ CATEGORIAS
    if (pathname === '/api/categorias' && method === 'GET') {
      sendJson(res, 200, CategoriaTable.listar());
      return true;
    }
    if (pathname === '/api/categorias' && method === 'POST') {
      const body = await readJsonBody(req);
      sendJson(
        res,
        201,
        CategoriaTable.registrar({
          nombre: String(body.nombre ?? ''),
          descripcion: String(body.descripcion ?? ''),
        })
      );
      return true;
    }
    const catProdMatch = pathname.match(/^\/api\/categorias\/(\d+)\/productos$/);
    if (catProdMatch && method === 'GET') {
      sendJson(res, 200, CategoriaTable.listarProductos(Number(catProdMatch[1])));
      return true;
    }
    const catIdMatch = pathname.match(/^\/api\/categorias\/(\d+)$/);
    if (catIdMatch) {
      const id = Number(catIdMatch[1]);
      if (method === 'PUT') {
        const body = await readJsonBody(req);
        sendJson(
          res,
          200,
          CategoriaTable.editar(id, {
            nombre: String(body.nombre ?? ''),
            descripcion: String(body.descripcion ?? ''),
          })
        );
        return true;
      }
      if (method === 'DELETE') {
        sendJson(res, 200, CategoriaTable.eliminar(id));
        return true;
      }
    }

    // ------------------------------------------------------------- PRODUCTOS
    if (pathname === '/api/productos' && method === 'GET') {
      sendJson(res, 200, ProductoTable.listar());
      return true;
    }
    if (pathname === '/api/productos' && method === 'POST') {
      const body = await readJsonBody(req);
      const created = ProductoTable.registrar({
        nombre: String(body.nombre ?? ''),
        unidad_medida: String(body.unidad_medida ?? 'Unidad'),
        precio_unitario: Number(body.precio_unitario ?? 0),
        descripcion: String(body.descripcion ?? ''),
        stock_actual: Number(body.stock_actual ?? 0),
        nivel_minimo: Number(body.nivel_minimo ?? 0),
        id_categoria: Number(body.id_categoria),
      });
      ControladorAlertaStock.verificarYGenerarAlerta(created.id_producto);
      sendJson(res, 201, created);
      return true;
    }
    const prodIdMatch = pathname.match(/^\/api\/productos\/(\d+)$/);
    if (prodIdMatch) {
      const id = Number(prodIdMatch[1]);
      if (method === 'PUT') {
        const body = await readJsonBody(req);
        const updated = ProductoTable.editar(id, {
          nombre: String(body.nombre ?? ''),
          unidad_medida: String(body.unidad_medida ?? 'Unidad'),
          precio_unitario: Number(body.precio_unitario ?? 0),
          descripcion: String(body.descripcion ?? ''),
          stock_actual: Number(body.stock_actual ?? 0),
          nivel_minimo: Number(body.nivel_minimo ?? 0),
          id_categoria: Number(body.id_categoria),
        });
        if (updated.stock_actual <= updated.nivel_minimo) {
          ControladorAlertaStock.verificarYGenerarAlerta(updated.id_producto);
        } else {
          ControladorAlertaStock.resolverSiStockSuficiente(updated.id_producto);
        }
        sendJson(res, 200, updated);
        return true;
      }
      if (method === 'DELETE') {
        sendJson(res, 200, ProductoTable.eliminar(id));
        return true;
      }
    }

    // ----------------------------------------------------------- MOVIMIENTOS
    if (pathname === '/api/movimientos' && method === 'GET') {
      const tipo = url.searchParams.get('tipo') ?? undefined;
      const idProd = url.searchParams.get('id_producto');
      sendJson(
        res,
        200,
        MovimientoInventarioTable.listar({
          tipo_movimiento: tipo,
          id_producto: idProd ? Number(idProd) : undefined,
        })
      );
      return true;
    }
    if (pathname === '/api/movimientos' && method === 'POST') {
      const body = await readJsonBody(req);
      const id_usuario = getActorUserId(req, body.id_usuario);
      const tipo = body.tipo_movimiento === 'ENTRADA' ? 'ENTRADA' : 'SALIDA';
      const result = ControladorInventario.registrarMovimiento({
        tipo_movimiento: tipo,
        id_producto: Number(body.id_producto),
        cantidad: Number(body.cantidad),
        motivo: String(body.motivo ?? ''),
        id_usuario,
        id_orden: body.id_orden ? Number(body.id_orden) : null,
      });
      sendJson(res, 201, result);
      return true;
    }
    const movAnularMatch = pathname.match(/^\/api\/movimientos\/(\d+)\/anular$/);
    if (movAnularMatch && method === 'POST') {
      const result = ControladorInventario.anularMovimiento(Number(movAnularMatch[1]));
      sendJson(res, 200, result);
      return true;
    }

    // --------------------------------------------------------------- ALERTAS
    if (pathname === '/api/alertas' && method === 'GET') {
      sendJson(res, 200, AlertaStockTable.listarTodas());
      return true;
    }
    if (pathname === '/api/alertas/pendientes' && method === 'GET') {
      sendJson(res, 200, AlertaStockTable.listarPendientes());
      return true;
    }
    const alertaResolverMatch = pathname.match(/^\/api\/alertas\/(\d+)\/resolver$/);
    if (alertaResolverMatch && method === 'POST') {
      sendJson(res, 200, ControladorAlertaStock.resolverManual(Number(alertaResolverMatch[1])));
      return true;
    }

    // ------------------------------------------------------------- VEHICULOS
    if (pathname === '/api/vehiculos' && method === 'GET') {
      sendJson(res, 200, VehiculoTable.listar());
      return true;
    }
    if (pathname === '/api/vehiculos' && method === 'POST') {
      const body = await readJsonBody(req);
      sendJson(
        res,
        201,
        VehiculoTable.registrar({
          placa: String(body.placa ?? ''),
          marca: String(body.marca ?? ''),
          modelo: String(body.modelo ?? ''),
          anio: Number(body.anio),
          propietario_nombre: String(body.propietario_nombre ?? ''),
          propietario_telefono: String(body.propietario_telefono ?? ''),
        })
      );
      return true;
    }
    const vehHistorialMatch = pathname.match(/^\/api\/vehiculos\/(\d+)\/historial$/);
    if (vehHistorialMatch && method === 'GET') {
      sendJson(res, 200, VehiculoTable.consultarHistorialOrdenes(Number(vehHistorialMatch[1])));
      return true;
    }
    const vehIdMatch = pathname.match(/^\/api\/vehiculos\/(\d+)$/);
    if (vehIdMatch && method === 'PUT') {
      const body = await readJsonBody(req);
      sendJson(
        res,
        200,
        VehiculoTable.editar(Number(vehIdMatch[1]), {
          placa: String(body.placa ?? ''),
          marca: String(body.marca ?? ''),
          modelo: String(body.modelo ?? ''),
          anio: Number(body.anio),
          propietario_nombre: String(body.propietario_nombre ?? ''),
          propietario_telefono: String(body.propietario_telefono ?? ''),
        })
      );
      return true;
    }

    // ------------------------------------------------------- ORDENES TRABAJO
    if (pathname === '/api/ordenes' && method === 'GET') {
      const estado = url.searchParams.get('estado') ?? undefined;
      const idMecanico = url.searchParams.get('id_mecanico');
      const idVehiculo = url.searchParams.get('id_vehiculo');
      sendJson(
        res,
        200,
        OrdenTrabajoTable.listar({
          estado,
          id_mecanico: idMecanico ? Number(idMecanico) : undefined,
          id_vehiculo: idVehiculo ? Number(idVehiculo) : undefined,
        })
      );
      return true;
    }
    if (pathname === '/api/ordenes' && method === 'POST') {
      const body = await readJsonBody(req);
      const id_mecanico = body.id_mecanico ? Number(body.id_mecanico) : getActorUserId(req);
      const created = OrdenTrabajoTable.abrir({
        id_vehiculo: Number(body.id_vehiculo),
        id_mecanico,
        diagnostico: String(body.diagnostico ?? ''),
      });
      sendJson(res, 201, created);
      return true;
    }
    const ordenRepuestosMatch = pathname.match(/^\/api\/ordenes\/(\d+)\/repuestos$/);
    if (ordenRepuestosMatch) {
      const idOrden = Number(ordenRepuestosMatch[1]);
      if (method === 'GET') {
        sendJson(res, 200, OrdenTrabajoTable.listarRepuestosAsignados(idOrden));
        return true;
      }
      if (method === 'POST') {
        const body = await readJsonBody(req);
        const id_usuario = getActorUserId(req, body.id_usuario);
        const result = ControladorAsignacionRepuesto.asignarRepuestoAOrden({
          id_orden: idOrden,
          id_producto: Number(body.id_producto),
          cantidad: Number(body.cantidad),
          id_usuario,
          motivo: typeof body.motivo === 'string' ? body.motivo : undefined,
        });
        sendJson(res, 201, result);
        return true;
      }
    }
    const ordenDiagMatch = pathname.match(/^\/api\/ordenes\/(\d+)\/diagnostico$/);
    if (ordenDiagMatch && method === 'PATCH') {
      const body = await readJsonBody(req);
      const estado =
        body.estado === 'ABIERTA' || body.estado === 'EN_PROCESO' ? body.estado : undefined;
      sendJson(
        res,
        200,
        OrdenTrabajoTable.registrarDiagnostico(
          Number(ordenDiagMatch[1]),
          String(body.diagnostico ?? ''),
          estado
        )
      );
      return true;
    }
    const ordenCerrarMatch = pathname.match(/^\/api\/ordenes\/(\d+)\/cerrar$/);
    if (ordenCerrarMatch && method === 'POST') {
      sendJson(res, 200, OrdenTrabajoTable.cerrar(Number(ordenCerrarMatch[1])));
      return true;
    }
    const ordenIdMatch = pathname.match(/^\/api\/ordenes\/(\d+)$/);
    if (ordenIdMatch && method === 'GET') {
      const orden = OrdenTrabajoTable.obtenerPorId(Number(ordenIdMatch[1]));
      if (!orden) {
        sendJson(res, 404, { error: 'Orden de trabajo no encontrada.' });
        return true;
      }
      sendJson(res, 200, {
        ...orden,
        repuestos: OrdenTrabajoTable.listarRepuestosAsignados(orden.id_orden),
      });
      return true;
    }

    // -------------------------------------------------------------- REPORTES
    if (pathname === '/api/reportes' && method === 'GET') {
      sendJson(res, 200, ReporteTable.listar());
      return true;
    }
    if (pathname === '/api/reportes/generar' && method === 'POST') {
      const body = await readJsonBody(req);
      const id_usuario = getActorUserId(req, body.id_usuario);
      const payload = ReporteTable.generar({
        tipo_reporte: String(body.tipo_reporte ?? 'INVENTARIO_GENERAL'),
        parametros: (body.parametros as Record<string, unknown>) ?? {},
        id_usuario,
      });
      sendJson(res, 201, payload);
      return true;
    }
    const reporteDatosMatch = pathname.match(/^\/api\/reportes\/(\d+)\/datos$/);
    if (reporteDatosMatch && method === 'GET') {
      const rep = ReporteTable.obtenerPorId(Number(reporteDatosMatch[1]));
      if (!rep) {
        sendJson(res, 404, { error: 'Reporte no encontrado.' });
        return true;
      }
      sendJson(res, 200, ReporteTable.construirDatosReporte(rep));
      return true;
    }

    sendJson(res, 404, { error: `Ruta API no encontrada: ${method} ${pathname}` });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor SQLite.';
    sendJson(res, 400, { error: message });
    return true;
  }
}
