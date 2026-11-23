import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Package,
  Search,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import {
  useInventoryStore,
  useNavigationStore,
  useServiceStore,
} from '../../store';
import type { AsignacionRepuestoResult, DetalleOrdenRepuesto } from '../../types/models';
import { formatCurrency } from '../../utils/formatters';
import {
  AssignPartButton,
  Badge,
  Card,
  EmptyState,
  FormInput,
  FormSelect,
  PageHeader,
} from '../../components/ui';

/**
 * Interfaz Asignar Repuesto (Diagrama de Actividades + Diagrama de Robustez Corregido)
 * Ejecuta los 6 pasos exactos en transacción SQLite:
 * 1. Obtener detalles de la orden -> 2. Consultar stock disponible ->
 * 3. Registrar detalle del repuesto -> 4. Registrar salida + actualizar stock ->
 * 5. Verificar stock mínimo -> 6. Generar alerta si corresponde.
 */
export function AsignarRepuestoView() {
  const ordenes = useServiceStore((s) => s.ordenes);
  const fetchRepuestosOrden = useServiceStore((s) => s.fetchRepuestosOrden);
  const asignarRepuestoAOrden = useServiceStore((s) => s.asignarRepuestoAOrden);
  const productos = useInventoryStore((s) => s.productos);

  const preselectedOrderId = useNavigationStore((s) => s.selectedOrderIdForAssign);
  const clearPreselected = useNavigationStore((s) => s.clearSelectedOrderForAssign);

  const openOrders = useMemo(() => ordenes.filter((o) => o.estado !== 'CERRADA'), [ordenes]);

  const [manualOrderId, setManualOrderId] = useState<string>('');
  const [productFilter, setProductFilter] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number>(
    productos[0]?.id_producto ?? 0
  );
  const [cantidad, setCantidad] = useState<string>('1');
  const [motivo, setMotivo] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<AsignacionRepuestoResult | null>(null);
  const [insufficientBanner, setInsufficientBanner] = useState<string | null>(null);
  const repuestosPorOrden = useServiceStore((s) => s.repuestosPorOrden);

  const selectedOrderId =
    manualOrderId ||
    (preselectedOrderId ? String(preselectedOrderId) : openOrders[0] ? String(openOrders[0].id_orden) : '');

  const activeOrder = useMemo(() => {
    const id = Number(selectedOrderId);
    return openOrders.find((o) => o.id_orden === id) ?? openOrders[0] ?? null;
  }, [selectedOrderId, openOrders]);

  const orderParts: DetalleOrdenRepuesto[] = activeOrder
    ? (repuestosPorOrden[activeOrder.id_orden] ?? [])
    : [];

  useEffect(() => {
    if (!activeOrder) return;
    void fetchRepuestosOrden(activeOrder.id_orden);
  }, [activeOrder, fetchRepuestosOrden]);

  const filteredProducts = useMemo(() => {
    const q = productFilter.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.categoria_nombre ?? '').toLowerCase().includes(q)
    );
  }, [productos, productFilter]);

  const selectedProduct = useMemo(
    () => productos.find((p) => p.id_producto === selectedProductId) ?? productos[0] ?? null,
    [productos, selectedProductId]
  );

  const qty = Math.max(0, Math.floor(Number(cantidad) || 0));
  const stockSuficiente = selectedProduct ? selectedProduct.stock_actual >= qty && qty > 0 : false;
  const stockResultante = selectedProduct ? selectedProduct.stock_actual - qty : 0;
  const dispararaAlerta =
    selectedProduct !== null && stockSuficiente && stockResultante <= selectedProduct.nivel_minimo;

  const handleAssign = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !selectedProduct) return;

    // Rama "No" del Diagrama de Actividades: ¿stock_actual >= cantidad solicitada?
    if (qty > selectedProduct.stock_actual) {
      setInsufficientBanner(
        `Stock insuficiente para "${selectedProduct.nombre}". Disponible: ${selectedProduct.stock_actual} ${selectedProduct.unidad_medida}(s), solicitado: ${qty}. No se realizó ningún descuento.`
      );
      setLastResult(null);
      return;
    }

    setInsufficientBanner(null);
    setSubmitting(true);
    const res = await asignarRepuestoAOrden({
      id_orden: activeOrder.id_orden,
      id_producto: selectedProduct.id_producto,
      cantidad: qty,
      motivo: motivo.trim() || undefined,
    });
    setSubmitting(false);

    if (res.ok && res.result) {
      setLastResult(res.result);
      setCantidad('1');
      setMotivo('');
      await fetchRepuestosOrden(activeOrder.id_orden);
    } else if (res.error) {
      setInsufficientBanner(res.error);
    }
  };

  const bceSteps = [
    { step: '01', label: 'OrdenTrabajo', desc: activeOrder ? `OT-#${activeOrder.id_orden} (${activeOrder.vehiculo_placa})` : 'Pendiente' },
    { step: '02', label: 'Producto (Stock)', desc: selectedProduct ? `Disponible: ${selectedProduct.stock_actual}` : 'Pendiente' },
    { step: '03', label: 'DetalleOrdenRepuesto', desc: lastResult ? `Detalle #${lastResult.detalle.id_detalle}` : 'Registro al confirmar' },
    { step: '04', label: 'MovimientoInventario', desc: lastResult ? `SALIDA #${lastResult.movimiento.id_movimiento}` : '«extend» Salida' },
    { step: '05', label: 'ControladorAlertaStock', desc: dispararaAlerta ? 'Alcanzará mínimo' : 'Verificación automática' },
    { step: '06', label: 'AlertaStock', desc: lastResult?.alertaGenerada ? `ALR-#${lastResult.alertaGenerada.id_alerta} GENERADA` : 'Condicional (<= mín.)' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="02 / DIAGRAMA DE ACTIVIDADES & ROBUSTEZ · CONTROLADOR ASIGNACIÓN"
        title="Asignar Repuesto a Orden de Trabajo"
        description="Selecciona la orden abierta, busca el repuesto e indica la cantidad. El sistema valida stock, registra detalle, genera salida de inventario y verifica alertas automáticamente."
      />

      {/* Barra visual de los 6 pasos del Diagrama de Robustez */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
        {bceSteps.map((s, idx) => (
          <div
            key={s.step}
            className="sigmat-card rounded-[4px] p-3 border-t-2"
            style={{
              borderTopColor:
                lastResult && idx <= 4
                  ? '#8CE043'
                  : idx === 5 && lastResult?.alertaGenerada
                    ? '#F2491E'
                    : 'var(--border-strong)',
            }}
          >
            <div className="font-mono-tech text-[10px] text-[var(--accent)] font-bold">
              PASO {s.step}
            </div>
            <div className="text-xs font-semibold text-[var(--text-primary)] mt-0.5 truncate">
              {s.label}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">{s.desc}</div>
          </div>
        ))}
      </div>

      {openOrders.length === 0 ? (
        <EmptyState
          title="No hay órdenes de trabajo abiertas"
          description="Abre primero una orden de trabajo en el módulo Órdenes de Trabajo para poder asignar repuestos."
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Columna Izquierda: Flujo del Mecánico */}
          <div className="xl:col-span-7 space-y-5">
            <Card
              index="INTERFAZ ASIGNAR REPUESTO"
              dotColor="#F2491E"
              title="1. Seleccionar Orden, Repuesto y Cantidad"
            >
              <form onSubmit={handleAssign} className="space-y-5">
                <FormSelect
                  label="Paso 1 — Seleccionar Orden de Trabajo activa *"
                  value={activeOrder ? String(activeOrder.id_orden) : ''}
                  onChange={(e) => {
                    setManualOrderId(e.target.value);
                    clearPreselected();
                    setLastResult(null);
                    setInsufficientBanner(null);
                  }}
                  options={openOrders.map((o) => ({
                    value: String(o.id_orden),
                    label: `OT-#${o.id_orden} · ${o.vehiculo_placa} (${o.vehiculo_marca} ${o.vehiculo_modelo}) — ${o.estado}`,
                  }))}
                />

                {/* Paso 2: Buscar y seleccionar repuesto */}
                <div className="space-y-2.5">
                  <div className="relative">
                    <FormInput
                      label="Paso 2 — Buscar y seleccionar repuesto del inventario"
                      placeholder="Filtra por nombre o categoría (Ej. Filtro, Brembo, Aceite...)"
                      value={productFilter}
                      onChange={(e) => setProductFilter(e.target.value)}
                    />
                    <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-[33px] pointer-events-none" />
                  </div>

                  <div className="max-h-56 overflow-y-auto border border-[var(--border-subtle)] rounded-[4px] divide-y divide-[var(--border-subtle)] bg-[var(--bg-elevated)]/40">
                    {filteredProducts.map((p) => {
                      const isSelected = selectedProduct?.id_producto === p.id_producto;
                      return (
                        <button
                          key={p.id_producto}
                          type="button"
                          onClick={() => {
                            setSelectedProductId(p.id_producto);
                            setInsufficientBanner(null);
                          }}
                          className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[var(--accent-soft)] border-l-2 border-l-[var(--accent)]'
                              : 'hover:bg-[var(--bg-elevated)]'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                              <Package className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                              <span className="truncate">{p.nombre}</span>
                            </div>
                            <div className="text-[11px] text-[var(--text-muted)]">
                              {p.categoria_nombre} · {formatCurrency(p.precio_unitario)} / {p.unidad_medida}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <Badge tone={p.stock_actual <= p.nivel_minimo ? 'danger' : 'ok'} dot>
                              Stock: {p.stock_actual}
                            </Badge>
                            <div className="text-[10px] font-mono-tech text-[var(--text-muted)] mt-0.5">
                              Mín: {p.nivel_minimo}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Paso 3: Indicar cantidad */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-4">
                    <FormInput
                      label="Paso 3 — Cantidad *"
                      type="number"
                      min="1"
                      required
                      value={cantidad}
                      onChange={(e) => {
                        setCantidad(e.target.value);
                        setInsufficientBanner(null);
                      }}
                    />
                  </div>
                  <div className="sm:col-span-8">
                    <FormInput
                      label="Observación / Motivo (opcional)"
                      placeholder="Se genera automáticamente vinculado a la OT si se deja vacío"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                    />
                  </div>
                </div>

                {/* Evaluación previa de stock */}
                {selectedProduct && (
                  <div className="p-3.5 rounded-[4px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tech">
                      <span>
                        SUBTOTAL ESTIMADO:{' '}
                        <strong className="text-[var(--text-primary)]">
                          {formatCurrency(qty * selectedProduct.precio_unitario)}
                        </strong>
                      </span>
                      <span>
                        STOCK TRAS SALIDA:{' '}
                        <strong
                          className={
                            stockResultante < 0
                              ? 'text-[var(--status-danger)]'
                              : dispararaAlerta
                                ? 'text-[var(--accent)]'
                                : 'text-[var(--status-ok)]'
                          }
                        >
                          {stockResultante} {selectedProduct.unidad_medida}(s)
                        </strong>
                      </span>
                    </div>

                    {dispararaAlerta && (
                      <div className="flex items-center gap-2 text-xs text-[var(--accent)]">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>
                          Aviso: El stock quedará ≤ nivel mínimo ({selectedProduct.nivel_minimo}).{' '}
                          <strong>ControladorAlertaStock</strong> generará una alerta pendiente.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {insufficientBanner && (
                  <div className="p-3.5 rounded-[4px] border border-[var(--status-danger)]/50 bg-[var(--status-danger-soft)] flex items-start gap-2.5 text-xs text-[var(--status-danger)]">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold uppercase font-mono-tech">
                        Stock Insuficiente (Rama NO del Diagrama)
                      </div>
                      <p className="mt-0.5">{insufficientBanner}</p>
                    </div>
                  </div>
                )}

                {lastResult && (
                  <div className="p-4 rounded-[4px] border border-[var(--status-ok)]/45 bg-[var(--status-ok-soft)] space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 font-bold text-[var(--status-ok)] font-mono-tech">
                      <CheckCircle2 className="w-4 h-4" />
                      REPUESTO ASIGNADO Y CONFIRMADO EN SQLITE
                    </div>
                    <p className="text-[var(--text-primary)]">
                      Detalle <strong>#{lastResult.detalle.id_detalle}</strong> registrado · Movimiento{' '}
                      <strong>SALIDA #{lastResult.movimiento.id_movimiento}</strong> · Stock actual de{' '}
                      <strong>{lastResult.producto.nombre}</strong>:{' '}
                      <strong>{lastResult.producto.stock_actual}</strong>.
                    </p>
                    {lastResult.alertaGenerada && (
                      <p className="text-[var(--accent)] font-semibold">
                        ⚠ Alerta de stock mínimo ALR-#{lastResult.alertaGenerada.id_alerta} generada automáticamente.
                      </p>
                    )}
                  </div>
                )}

                <AssignPartButton
                  type="submit"
                  size="lg"
                  fullWidth
                  loading={submitting}
                  label="Confirmar Asignación y Registrar Salida"
                />
              </form>
            </Card>
          </div>

          {/* Columna Derecha: Resumen de la Orden Seleccionada */}
          <div className="xl:col-span-5 space-y-5">
            {activeOrder && (
              <Card
                index={`ORDEN ACTIVA · OT-#${activeOrder.id_orden}`}
                dotColor="#8CE043"
                title={`${activeOrder.vehiculo_placa} — ${activeOrder.vehiculo_marca} ${activeOrder.vehiculo_modelo}`}
                subtitle={`Cliente: ${activeOrder.propietario_nombre} · Mecánico: ${activeOrder.mecanico_nombre}`}
                headerRight={
                  <Badge tone="accent" dot>
                    {activeOrder.estado.replace('_', ' ')}
                  </Badge>
                }
              >
                <div className="p-3 rounded-[4px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] mb-4">
                  <div className="font-mono-tech text-[10px] text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-[var(--accent)]" />
                    DIAGNÓSTICO
                  </div>
                  {activeOrder.diagnostico}
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono-tech text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                    Repuestos ya asignados ({orderParts.length})
                  </span>
                  <span className="font-mono-tech text-sm font-bold text-[var(--accent)]">
                    {formatCurrency(orderParts.reduce((a, b) => a + b.subtotal, 0))}
                  </span>
                </div>

                {orderParts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-strong)] rounded-[4px] flex flex-col items-center gap-2">
                    <Wrench className="w-5 h-5 text-[var(--accent)]" />
                    Sin repuestos cargados todavía en esta orden.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orderParts.map((item) => (
                      <div
                        key={item.id_detalle}
                        className="p-3 rounded-[4px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-[var(--text-primary)] truncate">
                            {item.producto_nombre}
                          </div>
                          <div className="font-mono-tech text-[11px] text-[var(--text-muted)]">
                            {item.cantidad} {item.unidad_medida} × {formatCurrency(item.precio_unitario)}
                          </div>
                        </div>
                        <div className="font-mono-tech font-bold text-[var(--text-primary)] shrink-0">
                          {formatCurrency(item.subtotal)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
