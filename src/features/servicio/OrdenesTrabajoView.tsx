import { useMemo, useState, type FormEvent } from 'react';
import { Car, Plus, Search, Wrench } from 'lucide-react';
import { getPermissionsForRole } from '../../config/roles.config';
import {
  useAuthStore,
  useNavigationStore,
  useServiceStore,
} from '../../store';
import type { DetalleOrdenRepuesto, OrdenTrabajo } from '../../types/models';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import {
  AssignPartButton,
  Badge,
  BaseButton,
  CancelButton,
  Card,
  CloseOrderButton,
  ConfirmDialog,
  CreateButton,
  EditButton,
  EmptyState,
  FormInput,
  FormSelect,
  FormTextarea,
  Modal,
  PageHeader,
  RefreshButton,
  SaveButton,
  ViewDetailButton,
} from '../../components/ui';

export function OrdenesTrabajoView() {
  const usuario = useAuthStore((s) => s.usuario);
  const perms = getPermissionsForRole(usuario?.nombre_rol);

  const ordenes = useServiceStore((s) => s.ordenes);
  const vehiculos = useServiceStore((s) => s.vehiculos);
  const loading = useServiceStore((s) => s.loading);
  const filtroEstado = useServiceStore((s) => s.filtroEstadoOrden);
  const searchQuery = useServiceStore((s) => s.searchOrdenQuery);
  const setFiltroEstado = useServiceStore((s) => s.setFiltroEstadoOrden);
  const setSearchQuery = useServiceStore((s) => s.setSearchOrdenQuery);
  const fetchServiceAll = useServiceStore((s) => s.fetchServiceAll);
  const abrirOrden = useServiceStore((s) => s.abrirOrden);
  const actualizarDiagnostico = useServiceStore((s) => s.actualizarDiagnostico);
  const cerrarOrden = useServiceStore((s) => s.cerrarOrden);
  const fetchRepuestosOrden = useServiceStore((s) => s.fetchRepuestosOrden);
  const createVehiculo = useServiceStore((s) => s.createVehiculo);

  const goToAssignPartsForOrder = useNavigationStore((s) => s.goToAssignPartsForOrder);

  // Modal Nueva Orden
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [idVehiculo, setIdVehiculo] = useState<string>(vehiculos[0] ? String(vehiculos[0].id_vehiculo) : '');
  const [diagnostico, setDiagnostico] = useState('');
  const [creatingVehicleInline, setCreatingVehicleInline] = useState(false);
  const [vehForm, setVehForm] = useState({
    placa: '',
    marca: '',
    modelo: '',
    anio: '2022',
    propietario_nombre: '',
    propietario_telefono: '',
  });
  const [saving, setSaving] = useState(false);

  // Modal Detalle / Diagnóstico
  const [detailOrder, setDetailOrder] = useState<OrdenTrabajo | null>(null);
  const [detailParts, setDetailParts] = useState<DetalleOrdenRepuesto[]>([]);
  const [editDiagText, setEditDiagText] = useState('');
  const [editDiagMode, setEditDiagMode] = useState(false);

  // Confirmar Cierre
  const [orderToClose, setOrderToClose] = useState<OrdenTrabajo | null>(null);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ordenes.filter((o) => {
      if (filtroEstado !== 'TODOS' && o.estado !== filtroEstado) return false;
      if (!q) return true;
      return (
        String(o.id_orden).includes(q) ||
        (o.vehiculo_placa ?? '').toLowerCase().includes(q) ||
        (o.propietario_nombre ?? '').toLowerCase().includes(q) ||
        o.diagnostico.toLowerCase().includes(q) ||
        (o.mecanico_nombre ?? '').toLowerCase().includes(q)
      );
    });
  }, [ordenes, filtroEstado, searchQuery]);

  const openDetailModal = async (ord: OrdenTrabajo) => {
    setDetailOrder(ord);
    setEditDiagText(ord.diagnostico);
    setEditDiagMode(false);
    const parts = await fetchRepuestosOrden(ord.id_orden);
    setDetailParts(parts);
  };

  const handleOpenNewOrder = () => {
    setCreatingVehicleInline(false);
    setIdVehiculo(vehiculos[0] ? String(vehiculos[0].id_vehiculo) : '');
    setDiagnostico('');
    setNewOrderOpen(true);
  };

  const handleCreateOrder = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let targetVehId = Number(idVehiculo || vehiculos[0]?.id_vehiculo);

    if (creatingVehicleInline) {
      const createdVeh = await createVehiculo({
        placa: vehForm.placa,
        marca: vehForm.marca,
        modelo: vehForm.modelo,
        anio: Number(vehForm.anio),
        propietario_nombre: vehForm.propietario_nombre,
        propietario_telefono: vehForm.propietario_telefono,
      });
      if (!createdVeh) {
        setSaving(false);
        return;
      }
      targetVehId = createdVeh.id_vehiculo;
    }

    const created = await abrirOrden({
      id_vehiculo: targetVehId,
      diagnostico,
      id_mecanico: usuario?.id_usuario,
    });
    setSaving(false);
    if (created) {
      setNewOrderOpen(false);
      setVehForm({
        placa: '',
        marca: '',
        modelo: '',
        anio: '2022',
        propietario_nombre: '',
        propietario_telefono: '',
      });
    }
  };

  const handleSaveDiagnostico = async () => {
    if (!detailOrder) return;
    setSaving(true);
    const ok = await actualizarDiagnostico(detailOrder.id_orden, editDiagText);
    setSaving(false);
    if (ok) {
      setDetailOrder({ ...detailOrder, diagnostico: editDiagText, estado: 'EN_PROCESO' });
      setEditDiagMode(false);
    }
  };

  const handleConfirmClose = async () => {
    if (!orderToClose) return;
    setSaving(true);
    const ok = await cerrarOrden(orderToClose.id_orden);
    setSaving(false);
    if (ok) {
      setOrderToClose(null);
      if (detailOrder?.id_orden === orderToClose.id_orden) {
        setDetailOrder(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="01 / MÓDULO SERVICIO TÉCNICO · TABLA ORDENES_TRABAJO"
        title="Órdenes de Trabajo"
        description="Registra ingresos de vehículos, actualiza diagnósticos técnicos, asigna repuestos y cierra órdenes completadas."
        actions={
          <>
            <RefreshButton spinning={loading} onClick={() => void fetchServiceAll()} />
            {perms.canCreateOrders && (
              <CreateButton size="sm" label="Registrar Orden de Trabajo" onClick={handleOpenNewOrder} />
            )}
          </>
        }
      />

      {/* Filtros */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex-1 max-w-md relative">
            <FormInput
              label="Buscar por placa, cliente, mecánico o diagnóstico"
              placeholder="Ej. 4821-LPX, Hilux, frenos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-[33px] pointer-events-none" />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(['TODOS', 'ABIERTA', 'EN_PROCESO', 'CERRADA'] as const).map((est) => (
              <BaseButton
                key={est}
                size="sm"
                variant={filtroEstado === est ? 'primary' : 'secondary'}
                onClick={() => setFiltroEstado(est)}
              >
                {est.replace('_', ' ')}
              </BaseButton>
            ))}
          </div>
        </div>
      </Card>

      {/* Lista de Órdenes */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No se encontraron órdenes de trabajo"
          description="Cambia el filtro o abre una nueva orden de trabajo para un vehículo cliente."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((ord) => {
            const isClosed = ord.estado === 'CERRADA';
            const tone = isClosed ? 'ok' : ord.estado === 'EN_PROCESO' ? 'accent' : 'info';

            return (
              <Card
                key={ord.id_orden}
                index={`OT-#${String(ord.id_orden).padStart(3, '0')} · ${ord.vehiculo_placa}`}
                dotColor={isClosed ? '#8CE043' : ord.estado === 'EN_PROCESO' ? '#F2491E' : '#3B82F6'}
                title={`${ord.vehiculo_marca} ${ord.vehiculo_modelo} (${ord.vehiculo_anio})`}
                subtitle={`Propietario: ${ord.propietario_nombre} · Mecánico: ${ord.mecanico_nombre}`}
                headerRight={
                  <Badge tone={tone} dot>
                    {ord.estado.replace('_', ' ')}
                  </Badge>
                }
              >
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-elevated)] p-3 rounded-[4px] border border-[var(--border-subtle)]">
                  {ord.diagnostico}
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2 font-mono-tech text-xs">
                  <div>
                    <div className="text-[10px] text-[var(--text-muted)]">INGRESO</div>
                    <div className="text-[var(--text-primary)] mt-0.5">
                      {formatDateTime(ord.fecha_ingreso)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--text-muted)]">CIERRE</div>
                    <div className="text-[var(--text-primary)] mt-0.5">
                      {ord.fecha_cierre ? formatDateTime(ord.fecha_cierre) : 'En taller'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[var(--text-muted)]">TOTAL REPUESTOS</div>
                    <div className="text-sm font-bold text-[var(--accent)] mt-0.5">
                      {formatCurrency(ord.total_repuestos)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
                  <ViewDetailButton
                    label={`Repuestos (${ord.cantidad_items ?? 0})`}
                    onClick={() => void openDetailModal(ord)}
                  />

                  {!isClosed && (
                    <div className="flex items-center gap-2">
                      {perms.canAssignParts && (
                        <AssignPartButton
                          size="xs"
                          label="Asignar Repuesto"
                          onClick={() => goToAssignPartsForOrder(ord.id_orden)}
                        />
                      )}
                      {perms.canCloseOrders && (
                        <CloseOrderButton
                          size="xs"
                          onClick={() => setOrderToClose(ord)}
                        />
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Abrir Nueva Orden de Trabajo */}
      <Modal
        open={newOrderOpen}
        onClose={() => setNewOrderOpen(false)}
        eyebrow="CU: REGISTRAR ORDEN DE TRABAJO · ORDENTRABAJO.ABRIR()"
        title="Nueva Orden de Trabajo"
        subtitle="Asocia un vehículo existente o registra un nuevo vehículo directamente al abrir la orden."
        size="lg"
        footer={
          <>
            <CancelButton onClick={() => setNewOrderOpen(false)} disabled={saving} />
            <SaveButton form="new-order-form" loading={saving} label="Abrir Orden de Trabajo" />
          </>
        }
      >
        <form id="new-order-form" onSubmit={handleCreateOrder} className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono-tech text-[11px] uppercase tracking-wider text-[var(--text-secondary)]">
              Selección de Vehículo
            </span>
            <BaseButton
              size="xs"
              variant="outline-accent"
              leftIcon={creatingVehicleInline ? <Car className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              onClick={() => setCreatingVehicleInline(!creatingVehicleInline)}
            >
              {creatingVehicleInline ? 'Usar vehículo existente' : 'Registrar vehículo nuevo'}
            </BaseButton>
          </div>

          {!creatingVehicleInline ? (
            <FormSelect
              label="Vehículo registrado *"
              value={idVehiculo}
              onChange={(e) => setIdVehiculo(e.target.value)}
              options={vehiculos.map((v) => ({
                value: String(v.id_vehiculo),
                label: `${v.placa} — ${v.marca} ${v.modelo} (${v.anio}) · ${v.propietario_nombre}`,
              }))}
            />
          ) : (
            <div className="p-4 rounded-[4px] border border-[var(--accent-border)] bg-[var(--accent-soft)]/30 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormInput
                  label="Placa *"
                  required
                  maxLength={10}
                  value={vehForm.placa}
                  onChange={(e) => setVehForm({ ...vehForm, placa: e.target.value.toUpperCase() })}
                  placeholder="7210-LPZ"
                />
                <FormInput
                  label="Marca *"
                  required
                  value={vehForm.marca}
                  onChange={(e) => setVehForm({ ...vehForm, marca: e.target.value })}
                  placeholder="Toyota"
                />
                <FormInput
                  label="Modelo *"
                  required
                  value={vehForm.modelo}
                  onChange={(e) => setVehForm({ ...vehForm, modelo: e.target.value })}
                  placeholder="Corolla Cross"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormInput
                  label="Año *"
                  type="number"
                  min="1960"
                  max="2030"
                  required
                  value={vehForm.anio}
                  onChange={(e) => setVehForm({ ...vehForm, anio: e.target.value })}
                />
                <FormInput
                  label="Propietario *"
                  required
                  value={vehForm.propietario_nombre}
                  onChange={(e) => setVehForm({ ...vehForm, propietario_nombre: e.target.value })}
                  placeholder="Nombre del cliente"
                />
                <FormInput
                  label="Teléfono *"
                  required
                  value={vehForm.propietario_telefono}
                  onChange={(e) => setVehForm({ ...vehForm, propietario_telefono: e.target.value })}
                  placeholder="+591 70000000"
                />
              </div>
            </div>
          )}

          <FormTextarea
            label="Diagnóstico inicial / Motivo de ingreso *"
            required
            maxLength={250}
            value={diagnostico}
            onChange={(e) => setDiagnostico(e.target.value)}
            placeholder="Describe síntomas reportados, inspección inicial y trabajos requeridos..."
          />
        </form>
      </Modal>

      {/* Modal Detalle de Orden + Repuestos + Editar Diagnóstico */}
      <Modal
        open={Boolean(detailOrder)}
        onClose={() => setDetailOrder(null)}
        eyebrow={`ORDEN OT-#${detailOrder?.id_orden ?? ''} · DETALLE TÉCNICO`}
        title={`${detailOrder?.vehiculo_placa ?? ''} — ${detailOrder?.vehiculo_marca ?? ''} ${detailOrder?.vehiculo_modelo ?? ''}`}
        subtitle={`Propietario: ${detailOrder?.propietario_nombre ?? ''} (${detailOrder?.propietario_telefono ?? ''})`}
        size="lg"
        footer={
          detailOrder && detailOrder.estado !== 'CERRADA' ? (
            <>
              {perms.canAssignParts && (
                <AssignPartButton
                  size="sm"
                  onClick={() => {
                    const id = detailOrder.id_orden;
                    setDetailOrder(null);
                    goToAssignPartsForOrder(id);
                  }}
                />
              )}
              {perms.canCloseOrders && (
                <CloseOrderButton size="sm" onClick={() => setOrderToClose(detailOrder)} />
              )}
            </>
          ) : undefined
        }
      >
        {detailOrder && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono-tech text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                  Diagnóstico Técnico
                </span>
                {perms.canCreateOrders && detailOrder.estado !== 'CERRADA' && !editDiagMode && (
                  <EditButton
                    label="Editar diagnóstico"
                    onClick={() => setEditDiagMode(true)}
                  />
                )}
              </div>

              {editDiagMode ? (
                <div className="space-y-2.5">
                  <FormTextarea
                    value={editDiagText}
                    onChange={(e) => setEditDiagText(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <CancelButton size="xs" onClick={() => setEditDiagMode(false)} />
                    <SaveButton
                      type="button"
                      size="xs"
                      loading={saving}
                      label="Guardar diagnóstico"
                      onClick={() => void handleSaveDiagnostico()}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-primary)] p-3.5 rounded-[4px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] leading-relaxed">
                  {detailOrder.diagnostico}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono-tech text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                  Repuestos Asignados (DetalleOrdenRepuesto)
                </span>
                <span className="font-mono-tech text-sm font-bold text-[var(--accent)]">
                  Total: {formatCurrency(detailParts.reduce((a, b) => a + b.subtotal, 0))}
                </span>
              </div>

              {detailParts.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-strong)] rounded-[4px] flex flex-col items-center gap-2">
                  <Wrench className="w-5 h-5 text-[var(--accent)]" />
                  Aún no se han asignado repuestos a esta orden de trabajo.
                </div>
              ) : (
                <div className="border border-[var(--border-subtle)] rounded-[4px] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] font-mono-tech text-[10px] uppercase text-[var(--text-muted)]">
                        <th className="py-2.5 px-3">Repuesto</th>
                        <th className="py-2.5 px-3 text-right">Cant.</th>
                        <th className="py-2.5 px-3 text-right">P. Unit.</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {detailParts.map((item) => (
                        <tr key={item.id_detalle}>
                          <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">
                            {item.producto_nombre}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono-tech">
                            {item.cantidad} {item.unidad_medida}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono-tech">
                            {formatCurrency(item.precio_unitario)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono-tech font-bold text-[var(--text-primary)]">
                            {formatCurrency(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(orderToClose)}
        onClose={() => setOrderToClose(null)}
        onConfirm={handleConfirmClose}
        loading={saving}
        variant="success"
        title={`Cerrar Orden OT-#${orderToClose?.id_orden ?? ''}`}
        description={`Se ejecutará OrdenTrabajo.cerrar() para el vehículo ${orderToClose?.vehiculo_placa ?? ''}. Una vez cerrada no se podrán asignar más repuestos.`}
        confirmLabel="Sí, cerrar orden"
      />
    </div>
  );
}
