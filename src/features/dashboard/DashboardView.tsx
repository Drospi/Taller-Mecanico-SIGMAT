import {
  AlertTriangle,
  ArrowRight,
  Car,
  ClipboardList,
  Database,
  DollarSign,
  Package,
  Users,
} from 'lucide-react';
import type { NavSectionId } from '../../config/roles.config';
import {
  useAuthStore,
  useInventoryStore,
  useNavigationStore,
  useServiceStore,
} from '../../store';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import {
  Badge,
  Card,
  PageHeader,
  PrimaryActionButton,
  RefreshButton,
  StatCard,
} from '../../components/ui';

interface CapabilityCardSpec {
  index: string;
  dotColor: string;
  title: string;
  description: string;
  tag: string;
  target: NavSectionId;
}

export function DashboardView() {
  const usuario = useAuthStore((s) => s.usuario);
  const dashboard = useInventoryStore((s) => s.dashboard);
  const alertas = useInventoryStore((s) => s.alertas);
  const movimientos = useInventoryStore((s) => s.movimientos);
  const loadingInv = useInventoryStore((s) => s.loading);
  const fetchInventoryAll = useInventoryStore((s) => s.fetchInventoryAll);
  const ordenes = useServiceStore((s) => s.ordenes);
  const fetchServiceAll = useServiceStore((s) => s.fetchServiceAll);
  const setActiveSection = useNavigationStore((s) => s.setActiveSection);

  const rol = usuario?.nombre_rol ?? 'Administrador';
  const alertasPendientes = alertas.filter((a) => a.estado === 'PENDIENTE');
  const ordenesActivas = ordenes.filter((o) => o.estado !== 'CERRADA');

  const capabilitiesByRole: Record<string, CapabilityCardSpec[]> = {
    Administrador: [
      {
        index: '01',
        dotColor: '#3B82F6',
        title: 'Gestión de Usuarios y Roles',
        description:
          'Alta, edición, activación de cuentas y asignación de roles para Administrador, Mecánico y Almacén.',
        tag: 'CU · USUARIOS',
        target: 'usuarios',
      },
      {
        index: '02',
        dotColor: '#CFD4DD',
        title: 'Clasificación de Categorías',
        description:
          'Administra familias de repuestos y consulta los productos vinculados por categoría en SQLite.',
        tag: 'CU · CATEGORÍAS',
        target: 'categorias',
      },
      {
        index: '03',
        dotColor: '#8CE043',
        title: 'Reportes Ejecutivos PDF / Excel',
        description:
          'Genera reportes persistidos de inventario, kardex de movimientos, órdenes de trabajo y alertas.',
        tag: 'CU · REPORTES',
        target: 'reportes',
      },
    ],
    Mecánico: [
      {
        index: '01',
        dotColor: '#F2491E',
        title: 'Órdenes de Trabajo',
        description:
          'Registra ingresos de vehículos, documenta diagnósticos técnicos y cierra órdenes completadas.',
        tag: 'SERVICIO TÉCNICO',
        target: 'ordenes',
      },
      {
        index: '02',
        dotColor: '#CFD4DD',
        title: 'Asignar Repuestos a Orden',
        description:
          'Flujo transaccional BCE: valida stock, registra detalle, descuenta inventario y dispara alertas.',
        tag: 'ROBUSTEZ · EXTEND',
        target: 'asignar-repuesto',
      },
      {
        index: '03',
        dotColor: '#8CE043',
        title: 'Historial y Consulta de Stock',
        description:
          'Consulta el historial completo por placa de vehículo y verifica disponibilidad de repuestos.',
        tag: 'TRAZABILIDAD',
        target: 'historial',
      },
    ],
    'Encargado de Almacén': [
      {
        index: '01',
        dotColor: '#F2491E',
        title: 'Catálogo de Productos',
        description:
          'Registra, edita y controla repuestos, precios unitarios, categorías y umbrales mínimos.',
        tag: 'CRUD · PRODUCTOS',
        target: 'productos',
      },
      {
        index: '02',
        dotColor: '#CFD4DD',
        title: 'Entradas y Salidas (Kardex)',
        description:
          'Registra ingresos de compras y salidas de almacén con actualización y anulación atómica.',
        tag: 'MOVIMIENTOS',
        target: 'movimientos',
      },
      {
        index: '03',
        dotColor: '#8CE043',
        title: 'Alertas de Stock Mínimo',
        description:
          'Monitorea alertas generadas automáticamente cuando stock_actual <= nivel_minimo y resuélvelas.',
        tag: 'INCLUDE · ALERTAS',
        target: 'alertas',
      },
    ],
  };

  const cards = capabilitiesByRole[rol] ?? capabilitiesByRole.Administrador;

  const ctaConfig: Record<
    string,
    { eyebrow: string; title: string; subtitle: string; buttonLabel: string; target: NavSectionId }
  > = {
    Administrador: {
      eyebrow: 'CONTROL EJECUTIVO SIGMAT',
      title: 'Un taller. Control total.',
      subtitle:
        'Consolida el inventario valorizado, las órdenes de servicio y las alertas críticas en un reporte PDF o Excel listo para gerencia.',
      buttonLabel: 'Generar Reporte Ahora',
      target: 'reportes',
    },
    Mecánico: {
      eyebrow: 'FLUJO ROBUSTEZ — SERVICIO TÉCNICO',
      title: 'Asigna repuestos sin errores de stock.',
      subtitle:
        'Ejecuta la asignación atómica: validación en tiempo real, detalle de orden, salida de almacén y alerta automática si alcanza el mínimo.',
      buttonLabel: 'Ir a Asignar Repuesto',
      target: 'asignar-repuesto',
    },
    'Encargado de Almacén': {
      eyebrow: 'MÓDULO DE INVENTARIO EN VIVO',
      title: 'Stock sincronizado en cada movimiento.',
      subtitle:
        'Registra entradas de proveedores o salidas de almacén y mantén resueltas todas las alertas de stock mínimo.',
      buttonLabel: 'Registrar Movimiento',
      target: 'movimientos',
    },
  };

  const activeCta = ctaConfig[rol] ?? ctaConfig.Administrador;

  const handleRefresh = () => {
    void Promise.all([fetchInventoryAll(), fetchServiceAll()]);
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={`PANEL OPERATIVO / ACTOR: ${rol.toUpperCase()}`}
        title={`Bienvenido, ${usuario?.nombre ?? ''} ${usuario?.apellido ?? ''}`}
        description="Supervisión en tiempo real de inventario, órdenes de servicio técnico y alertas de stock mínimo sincronizadas con SQLite."
        actions={<RefreshButton spinning={loadingInv} onClick={handleRefresh} />}
      />

      {/* KPIs principales */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          index="KPI 01"
          label="Valorización Inventario"
          value={formatCurrency(dashboard?.valorInventario ?? 0)}
          helper={`${dashboard?.totalProductos ?? 0} repuestos registrados`}
          dotColor="#F2491E"
          icon={<DollarSign className="w-4 h-4" />}
          onClick={() => setActiveSection('productos')}
        />
        <StatCard
          index="KPI 02"
          label="Alertas Stock Mínimo"
          value={alertasPendientes.length}
          helper={alertasPendientes.length > 0 ? 'Requieren reposición' : 'Stock dentro de tolerancia'}
          dotColor={alertasPendientes.length > 0 ? '#F2491E' : '#8CE043'}
          icon={<AlertTriangle className="w-4 h-4" />}
          onClick={
            rol !== 'Mecánico' ? () => setActiveSection('alertas') : () => setActiveSection('productos')
          }
        />
        <StatCard
          index="KPI 03"
          label="Órdenes en Taller"
          value={dashboard?.ordenesAbiertas ?? ordenesActivas.length}
          helper={`${dashboard?.ordenesCerradas ?? 0} cerradas · ${dashboard?.totalVehiculos ?? 0} vehículos`}
          dotColor="#CFD4DD"
          icon={<ClipboardList className="w-4 h-4" />}
          onClick={
            rol !== 'Encargado de Almacén'
              ? () => setActiveSection('ordenes')
              : () => setActiveSection('movimientos')
          }
        />
        <StatCard
          index="KPI 04"
          label="Personal Activo / BD"
          value={`${dashboard?.totalUsuariosActivos ?? 0} / 10`}
          helper="Usuarios activos · 10 tablas SQLite"
          dotColor="#8CE043"
          icon={rol === 'Administrador' ? <Users className="w-4 h-4" /> : <Database className="w-4 h-4" />}
          onClick={() => setActiveSection('arquitectura')}
        />
      </section>

      {/* Tarjetas de Capacidades 01 / 02 / 03 inspiradas en AXIS WORKS */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
          <div>
            <div className="font-mono-tech text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              CAPACIDADES DEL ACTOR
            </div>
            <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mt-1">
              Módulos habilitados para {rol}
            </h2>
          </div>
          <span className="font-mono-tech text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
            DIAGRAMA DE CASOS DE USO · SIGMAT
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div
              key={card.index}
              onClick={() => setActiveSection(card.target)}
              className="sigmat-card sigmat-card-interactive rounded-[4px] p-5 flex flex-col justify-between gap-5 cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: card.dotColor }}
                    />
                    <span className="font-mono-tech text-xs text-[var(--text-secondary)] font-semibold">
                      {card.index}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all" />
                </div>

                <h3 className="font-display text-lg font-bold text-[var(--text-primary)] mt-4">
                  {card.title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Badge tone="neutral">{card.tag}</Badge>
                <span className="font-mono-tech text-[11px] text-[var(--accent)] font-medium">
                  Abrir →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Paneles de actividad en vivo */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Alertas activas */}
        <Card
          index="MONITOR 01"
          dotColor="#F2491E"
          title="Alertas de Stock Mínimo Pendientes"
          subtitle="Productos con stock_actual <= nivel_minimo"
          headerRight={
            <Badge tone={alertasPendientes.length > 0 ? 'accent' : 'ok'} dot>
              {alertasPendientes.length} PENDIENTES
            </Badge>
          }
        >
          {alertasPendientes.length === 0 ? (
            <div className="text-xs text-[var(--text-secondary)] py-6 text-center">
              Todos los repuestos se encuentran por encima de su nivel mínimo.
            </div>
          ) : (
            <div className="space-y-2.5">
              {alertasPendientes.slice(0, 5).map((alerta) => (
                <div
                  key={alerta.id_alerta}
                  className="flex items-center justify-between gap-3 p-3 rounded-[4px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                      <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {alerta.producto_nombre}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5 font-mono-tech">
                      Stock: <strong className="text-[var(--accent)]">{alerta.stock_actual}</strong> / Mínimo:{' '}
                      {alerta.nivel_minimo} {alerta.unidad_medida}(s)
                    </div>
                  </div>
                  <Badge tone="danger" dot>
                    CRÍTICO
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Órdenes o Movimientos recientes según el rol */}
        {rol === 'Encargado de Almacén' ? (
          <Card
            index="MONITOR 02"
            dotColor="#8CE043"
            title="Últimos Movimientos de Inventario"
            subtitle="Entradas de compra y salidas asociadas a órdenes"
            headerRight={<Badge tone="neutral">{movimientos.length} REGISTROS</Badge>}
          >
            <div className="space-y-2.5">
              {movimientos.slice(0, 5).map((mov) => (
                <div
                  key={mov.id_movimiento}
                  className="flex items-center justify-between gap-3 p-3 rounded-[4px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {mov.producto_nombre}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                      {mov.motivo}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge tone={mov.tipo_movimiento === 'ENTRADA' ? 'ok' : 'accent'}>
                      {mov.tipo_movimiento === 'ENTRADA' ? `+${mov.cantidad}` : `-${mov.cantidad}`}
                    </Badge>
                    <div className="text-[10px] font-mono-tech text-[var(--text-muted)] mt-1">
                      {formatDateTime(mov.fecha)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card
            index="MONITOR 02"
            dotColor="#8CE043"
            title="Órdenes de Trabajo Recientes"
            subtitle="Vehículos en atención y últimos servicios registrados"
            headerRight={<Badge tone="neutral">{ordenes.length} TOTAL</Badge>}
          >
            <div className="space-y-2.5">
              {ordenes.slice(0, 5).map((ord) => (
                <div
                  key={ord.id_orden}
                  className="flex items-center justify-between gap-3 p-3 rounded-[4px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Car className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                      <span className="font-mono-tech text-xs font-bold text-[var(--text-primary)]">
                        OT-#{ord.id_orden} · {ord.vehiculo_placa}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)] truncate">
                        {ord.vehiculo_marca} {ord.vehiculo_modelo}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                      {ord.diagnostico}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge
                      tone={
                        ord.estado === 'CERRADA'
                          ? 'ok'
                          : ord.estado === 'EN_PROCESO'
                            ? 'accent'
                            : 'info'
                      }
                      dot
                    >
                      {ord.estado}
                    </Badge>
                    <div className="text-[11px] font-mono-tech text-[var(--text-secondary)] mt-1">
                      {formatCurrency(ord.total_repuestos)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>

      {/* Banner naranja industrial inspirado en el bloque inferior de AXIS WORKS */}
      <section className="sigmat-cta-banner rounded-[4px] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="font-mono-tech text-[11px] uppercase tracking-[0.2em] text-white/80">
            {activeCta.eyebrow}
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-2">
            {activeCta.title}
          </h2>
          <p className="text-sm text-white/85 mt-2 leading-relaxed">{activeCta.subtitle}</p>
        </div>
        <PrimaryActionButton
          invertOnBanner
          size="lg"
          label={activeCta.buttonLabel}
          onClick={() => setActiveSection(activeCta.target)}
        />
      </section>
    </div>
  );
}
