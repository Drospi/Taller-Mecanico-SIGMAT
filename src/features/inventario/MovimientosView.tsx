import { useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { getPermissionsForRole } from '../../config/roles.config';
import { useAuthStore, useInventoryStore } from '../../store';
import type { MovimientoInventario, TipoMovimiento } from '../../types/models';
import { formatDateTime } from '../../utils/formatters';
import {
  Badge,
  BaseButton,
  Card,
  ConfirmDialog,
  DeleteButton,
  EmptyState,
  FormInput,
  FormSelect,
  PageHeader,
  RefreshButton,
  StockMovementButton,
} from '../../components/ui';

export function MovimientosView() {
  const usuario = useAuthStore((s) => s.usuario);
  const perms = getPermissionsForRole(usuario?.nombre_rol);

  const productos = useInventoryStore((s) => s.productos);
  const movimientos = useInventoryStore((s) => s.movimientos);
  const loading = useInventoryStore((s) => s.loading);
  const fetchInventoryAll = useInventoryStore((s) => s.fetchInventoryAll);
  const registrarMovimiento = useInventoryStore((s) => s.registrarMovimiento);
  const anularMovimiento = useInventoryStore((s) => s.anularMovimiento);

  const [tipo, setTipo] = useState<TipoMovimiento>('ENTRADA');
  const [idProducto, setIdProducto] = useState<string>(
    productos[0] ? String(productos[0].id_producto) : ''
  );
  const [cantidad, setCantidad] = useState<string>('1');
  const [motivo, setMotivo] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'ENTRADA' | 'SALIDA'>('TODOS');
  const [movToAnnul, setMovToAnnul] = useState<MovimientoInventario | null>(null);

  const selectedProduct = useMemo(() => {
    const id = Number(idProducto || productos[0]?.id_producto);
    return productos.find((p) => p.id_producto === id) ?? productos[0] ?? null;
  }, [idProducto, productos]);

  const parsedQty = Math.max(0, Math.floor(Number(cantidad) || 0));
  const projectedStock = selectedProduct
    ? tipo === 'ENTRADA'
      ? selectedProduct.stock_actual + parsedQty
      : selectedProduct.stock_actual - parsedQty
    : 0;
  const insufficient = tipo === 'SALIDA' && selectedProduct !== null && parsedQty > selectedProduct.stock_actual;
  const willTriggerAlert =
    selectedProduct !== null && !insufficient && projectedStock <= selectedProduct.nivel_minimo;

  const filteredMovs = useMemo(
    () =>
      movimientos.filter((m) => (filtroTipo === 'TODOS' ? true : m.tipo_movimiento === filtroTipo)),
    [movimientos, filtroTipo]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || insufficient) return;
    setSubmitting(true);
    const res = await registrarMovimiento({
      tipo_movimiento: tipo,
      id_producto: selectedProduct.id_producto,
      cantidad: parsedQty,
      motivo,
    });
    setSubmitting(false);
    if (res.ok) {
      setCantidad('1');
      setMotivo('');
    }
  };

  const handleConfirmAnnul = async () => {
    if (!movToAnnul) return;
    setSubmitting(true);
    const ok = await anularMovimiento(movToAnnul.id_movimiento);
    setSubmitting(false);
    if (ok) setMovToAnnul(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="05 / DIAGRAMA DE ACTIVIDADES — MÓDULO INVENTARIO"
        title="Entradas y Salidas de Inventario"
        description="Registra movimientos de almacén con actualización atómica de stock_actual y verificación automática de alertas de stock mínimo («include»)."
        actions={<RefreshButton spinning={loading} onClick={() => void fetchInventoryAll()} />}
      />

      {perms.canRegisterMovements && (
        <Card
          index="CONTROLADOR INVENTARIO"
          dotColor={tipo === 'ENTRADA' ? '#8CE043' : '#F2491E'}
          title="Registrar Movimiento de Inventario"
          subtitle="Selecciona tipo de movimiento (Entrada o Salida), producto, cantidad y motivo."
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Selector Entrada / Salida */}
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setTipo('ENTRADA')}
                className={`p-3 rounded-[4px] border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                  tipo === 'ENTRADA'
                    ? 'border-[var(--status-ok)] bg-[var(--status-ok-soft)] text-[var(--text-primary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-[var(--status-ok)] shrink-0" />
                <div>
                  <div className="text-xs font-bold font-mono-tech">ENTRADA</div>
                  <div className="text-[11px] text-[var(--text-muted)]">Incrementa stock</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTipo('SALIDA')}
                className={`p-3 rounded-[4px] border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                  tipo === 'SALIDA'
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-[var(--accent)] shrink-0" />
                <div>
                  <div className="text-xs font-bold font-mono-tech">SALIDA</div>
                  <div className="text-[11px] text-[var(--text-muted)]">Descuenta stock</div>
                </div>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5">
                <FormSelect
                  label="Producto / Repuesto *"
                  value={selectedProduct ? String(selectedProduct.id_producto) : ''}
                  onChange={(e) => setIdProducto(e.target.value)}
                  options={productos.map((p) => ({
                    value: String(p.id_producto),
                    label: `${p.nombre} — Stock: ${p.stock_actual} ${p.unidad_medida}`,
                  }))}
                />
              </div>

              <div className="md:col-span-2">
                <FormInput
                  label="Cantidad *"
                  type="number"
                  min="1"
                  required
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                />
              </div>

              <div className="md:col-span-5">
                <FormInput
                  label="Motivo / Documento *"
                  required
                  maxLength={150}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder={
                    tipo === 'ENTRADA'
                      ? 'Ej. Reposición proveedor — Factura #9042'
                      : 'Ej. Salida para mantenimiento interno / ajuste'
                  }
                />
              </div>
            </div>

            {/* Simulación en tiempo real del flujo del Diagrama de Actividades */}
            {selectedProduct && (
              <div className="p-3.5 rounded-[4px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono-tech">
                  <span className="text-[var(--text-muted)]">
                    STOCK ACTUAL:{' '}
                    <strong className="text-[var(--text-primary)]">{selectedProduct.stock_actual}</strong>
                  </span>
                  <span className="text-[var(--accent)]">→</span>
                  <span className="text-[var(--text-muted)]">
                    RESULTADO:{' '}
                    <strong
                      className={
                        insufficient
                          ? 'text-[var(--status-danger)]'
                          : willTriggerAlert
                            ? 'text-[var(--accent)]'
                            : 'text-[var(--status-ok)]'
                      }
                    >
                      {projectedStock} {selectedProduct.unidad_medida}(s)
                    </strong>
                  </span>
                  <span className="text-[var(--text-muted)]">
                    (MÍNIMO: {selectedProduct.nivel_minimo})
                  </span>
                </div>

                <div>
                  {insufficient ? (
                    <Badge tone="danger" dot>
                      STOCK INSUFICIENTE
                    </Badge>
                  ) : willTriggerAlert ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--accent)] font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Activará alerta de stock mínimo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--status-ok)] font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Stock saludable tras movimiento
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <StockMovementButton
                type="submit"
                tipo={tipo}
                loading={submitting}
                disabled={insufficient || !selectedProduct || parsedQty <= 0}
              />
            </div>
          </form>
        </Card>
      )}

      {/* Kardex / Historial de Movimientos */}
      <Card
        index={`KARDEX SQLITE · ${filteredMovs.length} MOVIMIENTOS`}
        title="Historial de Movimientos de Inventario"
        headerRight={
          <div className="flex items-center gap-1.5">
            {(['TODOS', 'ENTRADA', 'SALIDA'] as const).map((f) => (
              <BaseButton
                key={f}
                size="xs"
                variant={filtroTipo === f ? 'primary' : 'secondary'}
                onClick={() => setFiltroTipo(f)}
              >
                {f}
              </BaseButton>
            ))}
          </div>
        }
        noPadding
      >
        {filteredMovs.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Sin movimientos registrados"
              description="Aún no hay movimientos bajo el filtro seleccionado."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 font-mono-tech text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Cantidad</th>
                  <th className="py-3 px-4">Orden</th>
                  <th className="py-3 px-4">Responsable</th>
                  <th className="py-3 px-4">Motivo</th>
                  {perms.canRegisterMovements && <th className="py-3 px-4 text-right">Acción</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
                {filteredMovs.map((mov) => (
                  <tr
                    key={mov.id_movimiento}
                    className={
                      mov.anulado
                        ? 'opacity-50 line-through bg-[var(--bg-elevated)]/20'
                        : 'hover:bg-[var(--bg-elevated)]/40'
                    }
                  >
                    <td className="py-3 px-4 font-mono-tech text-[var(--text-muted)]">
                      #{mov.id_movimiento}
                    </td>
                    <td className="py-3 px-4 font-mono-tech whitespace-nowrap text-[var(--text-secondary)]">
                      {formatDateTime(mov.fecha)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        tone={mov.anulado ? 'neutral' : mov.tipo_movimiento === 'ENTRADA' ? 'ok' : 'accent'}
                        dot
                      >
                        {mov.anulado ? 'ANULADO' : mov.tipo_movimiento}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                      {mov.producto_nombre}
                    </td>
                    <td className="py-3 px-4 font-mono-tech font-bold text-[var(--text-primary)]">
                      {mov.tipo_movimiento === 'ENTRADA' ? `+${mov.cantidad}` : `-${mov.cantidad}`}{' '}
                      <span className="font-normal text-[var(--text-muted)]">{mov.unidad_medida}</span>
                    </td>
                    <td className="py-3 px-4 font-mono-tech">
                      {mov.id_orden ? (
                        <Badge tone="info" pill={false}>
                          OT-#{mov.id_orden}
                        </Badge>
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[var(--text-secondary)]">{mov.usuario_nombre}</td>
                    <td className="py-3 px-4 text-[var(--text-secondary)] max-w-xs truncate">
                      {mov.motivo}
                    </td>
                    {perms.canRegisterMovements && (
                      <td className="py-3 px-4 text-right">
                        {!mov.anulado && (
                          <DeleteButton
                            label="Anular"
                            onClick={() => setMovToAnnul(mov)}
                          />
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(movToAnnul)}
        onClose={() => setMovToAnnul(null)}
        onConfirm={handleConfirmAnnul}
        loading={submitting}
        title={`Anular Movimiento #${movToAnnul?.id_movimiento ?? ''}`}
        description={`Se ejecutará MovimientoInventario.anular(), revirtiendo automáticamente ${movToAnnul?.cantidad ?? 0} unidad(es) de "${movToAnnul?.producto_nombre ?? ''}" en SQLite.`}
        confirmLabel="Sí, anular y revertir stock"
      />
    </div>
  );
}
