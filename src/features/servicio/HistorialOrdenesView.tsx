import { useMemo, useState, type FormEvent } from 'react';
import { Car, History, Phone, Search, User } from 'lucide-react';
import { getPermissionsForRole } from '../../config/roles.config';
import { useAuthStore, useServiceStore } from '../../store';
import type { OrdenTrabajo, Vehiculo } from '../../types/models';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import {
  Badge,
  CancelButton,
  Card,
  CreateButton,
  EditButton,
  EmptyState,
  FormInput,
  Modal,
  PageHeader,
  RefreshButton,
  SaveButton,
  ViewDetailButton,
} from '../../components/ui';

export function HistorialOrdenesView() {
  const usuario = useAuthStore((s) => s.usuario);
  const perms = getPermissionsForRole(usuario?.nombre_rol);

  const vehiculos = useServiceStore((s) => s.vehiculos);
  const ordenes = useServiceStore((s) => s.ordenes);
  const loading = useServiceStore((s) => s.loading);
  const fetchServiceAll = useServiceStore((s) => s.fetchServiceAll);
  const createVehiculo = useServiceStore((s) => s.createVehiculo);
  const updateVehiculo = useServiceStore((s) => s.updateVehiculo);
  const fetchHistorialVehiculo = useServiceStore((s) => s.fetchHistorialVehiculo);

  const [query, setQuery] = useState('');
  const [vehModalOpen, setVehModalOpen] = useState(false);
  const [editingVeh, setEditingVeh] = useState<Vehiculo | null>(null);
  const [form, setForm] = useState({
    placa: '',
    marca: '',
    modelo: '',
    anio: '2022',
    propietario_nombre: '',
    propietario_telefono: '',
  });
  const [saving, setSaving] = useState(false);

  const [historyVehicle, setHistoryVehicle] = useState<Vehiculo | null>(null);
  const [historyOrders, setHistoryOrders] = useState<OrdenTrabajo[]>([]);

  const filteredVehicles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vehiculos;
    return vehiculos.filter(
      (v) =>
        v.placa.toLowerCase().includes(q) ||
        v.marca.toLowerCase().includes(q) ||
        v.modelo.toLowerCase().includes(q) ||
        v.propietario_nombre.toLowerCase().includes(q)
    );
  }, [vehiculos, query]);

  const openCreate = () => {
    setEditingVeh(null);
    setForm({
      placa: '',
      marca: '',
      modelo: '',
      anio: '2023',
      propietario_nombre: '',
      propietario_telefono: '',
    });
    setVehModalOpen(true);
  };

  const openEdit = (v: Vehiculo) => {
    setEditingVeh(v);
    setForm({
      placa: v.placa,
      marca: v.marca,
      modelo: v.modelo,
      anio: String(v.anio),
      propietario_nombre: v.propietario_nombre,
      propietario_telefono: v.propietario_telefono,
    });
    setVehModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      placa: form.placa,
      marca: form.marca,
      modelo: form.modelo,
      anio: Number(form.anio),
      propietario_nombre: form.propietario_nombre,
      propietario_telefono: form.propietario_telefono,
    };
    const ok = editingVeh
      ? await updateVehiculo(editingVeh.id_vehiculo, payload)
      : Boolean(await createVehiculo(payload));
    setSaving(false);
    if (ok) setVehModalOpen(false);
  };

  const openHistory = async (v: Vehiculo) => {
    setHistoryVehicle(v);
    const list = await fetchHistorialVehiculo(v.id_vehiculo);
    setHistoryOrders(list);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="03 / CU: CONSULTAR HISTORIAL DE ÓRDENES · TABLA VEHICULOS"
        title="Historial de Órdenes y Vehículos"
        description="Consulta el historial técnico acumulado de cada vehículo mediante Vehiculo.consultarHistorialOrdenes() y gestiona el parque vehicular cliente."
        actions={
          <>
            <RefreshButton spinning={loading} onClick={() => void fetchServiceAll()} />
            {perms.canCreateOrders && (
              <CreateButton size="sm" label="Registrar Vehículo" onClick={openCreate} />
            )}
          </>
        }
      />

      <Card>
        <div className="relative max-w-lg">
          <FormInput
            label="Buscar vehículo por placa, marca, modelo o propietario"
            placeholder="Ej. 4821-LPX, Toyota, Roberto..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-[33px] pointer-events-none" />
        </div>
      </Card>

      {/* Tarjetas de Vehículos */}
      {filteredVehicles.length === 0 ? (
        <EmptyState
          title="Sin vehículos encontrados"
          description="No existen coincidencias con la búsqueda actual."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredVehicles.map((v, idx) => (
            <Card
              key={v.id_vehiculo}
              index={`VEH ${String(idx + 1).padStart(2, '0')} · ${v.anio}`}
              dotColor="#F2491E"
              title={`${v.marca} ${v.modelo}`}
              headerRight={
                <Badge tone="accent" pill={false}>
                  {v.placa}
                </Badge>
              }
            >
              <div className="space-y-2 text-xs text-[var(--text-secondary)]">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>{v.propietario_nombre}</span>
                </div>
                <div className="flex items-center gap-2 font-mono-tech">
                  <Phone className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>{v.propietario_telefono}</span>
                </div>
                <div className="flex items-center gap-2 font-mono-tech">
                  <Car className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>{v.total_ordenes ?? 0} orden(es) en historial</span>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                <ViewDetailButton
                  label="Consultar Historial"
                  onClick={() => void openHistory(v)}
                />
                {perms.canCreateOrders && <EditButton onClick={() => openEdit(v)} />}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Historial Consolidado de Órdenes */}
      <Card
        index={`HISTORIAL GENERAL · ${ordenes.length} ÓRDENES`}
        title="Registro Histórico Completo de Servicio Técnico"
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 font-mono-tech text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                <th className="py-3 px-4">Orden</th>
                <th className="py-3 px-4">Placa / Vehículo</th>
                <th className="py-3 px-4">Mecánico</th>
                <th className="py-3 px-4">Ingreso / Cierre</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Total Repuestos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
              {ordenes.map((o) => (
                <tr key={o.id_orden} className="hover:bg-[var(--bg-elevated)]/40">
                  <td className="py-3 px-4 font-mono-tech font-bold text-[var(--text-primary)]">
                    OT-#{o.id_orden}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono-tech font-semibold text-[var(--accent)]">
                      {o.vehiculo_placa}
                    </div>
                    <div className="text-[var(--text-secondary)]">
                      {o.vehiculo_marca} {o.vehiculo_modelo} ({o.propietario_nombre})
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[var(--text-secondary)]">{o.mecanico_nombre}</td>
                  <td className="py-3 px-4 font-mono-tech text-[var(--text-secondary)]">
                    <div>In: {formatDateTime(o.fecha_ingreso)}</div>
                    <div className="text-[var(--text-muted)]">
                      Fin: {o.fecha_cierre ? formatDateTime(o.fecha_cierre) : 'En curso'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      tone={o.estado === 'CERRADA' ? 'ok' : o.estado === 'EN_PROCESO' ? 'accent' : 'info'}
                      dot
                    >
                      {o.estado}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right font-mono-tech font-bold text-[var(--text-primary)]">
                    {formatCurrency(o.total_repuestos)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Vehículo CRUD */}
      <Modal
        open={vehModalOpen}
        onClose={() => setVehModalOpen(false)}
        eyebrow={editingVeh ? 'VEHICULO.EDITAR()' : 'VEHICULO.REGISTRAR()'}
        title={editingVeh ? `Editar Vehículo ${editingVeh.placa}` : 'Registrar Nuevo Vehículo'}
        footer={
          <>
            <CancelButton onClick={() => setVehModalOpen(false)} disabled={saving} />
            <SaveButton form="veh-form" loading={saving} />
          </>
        }
      >
        <form id="veh-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Placa *"
              required
              maxLength={10}
              value={form.placa}
              onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })}
              placeholder="4821-LPX"
            />
            <FormInput
              label="Año *"
              type="number"
              min="1960"
              max="2035"
              required
              value={form.anio}
              onChange={(e) => setForm({ ...form, anio: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Marca *"
              required
              maxLength={40}
              value={form.marca}
              onChange={(e) => setForm({ ...form, marca: e.target.value })}
            />
            <FormInput
              label="Modelo *"
              required
              maxLength={40}
              value={form.modelo}
              onChange={(e) => setForm({ ...form, modelo: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Nombre del propietario *"
              required
              maxLength={80}
              value={form.propietario_nombre}
              onChange={(e) => setForm({ ...form, propietario_nombre: e.target.value })}
            />
            <FormInput
              label="Teléfono de contacto *"
              required
              maxLength={20}
              value={form.propietario_telefono}
              onChange={(e) => setForm({ ...form, propietario_telefono: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Modal Historial por Vehículo */}
      <Modal
        open={Boolean(historyVehicle)}
        onClose={() => setHistoryVehicle(null)}
        eyebrow="VEHICULO.CONSULTARHISTORIALORDENES()"
        title={`Historial: ${historyVehicle?.placa ?? ''} — ${historyVehicle?.marca ?? ''} ${historyVehicle?.modelo ?? ''}`}
        subtitle={`Propietario: ${historyVehicle?.propietario_nombre ?? ''} · ${historyVehicle?.propietario_telefono ?? ''}`}
        size="lg"
      >
        {historyOrders.length === 0 ? (
          <div className="py-10 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-2">
            <History className="w-6 h-6 text-[var(--accent)]" />
            Este vehículo aún no posee órdenes de trabajo registradas.
          </div>
        ) : (
          <div className="space-y-3">
            {historyOrders.map((ord) => (
              <div
                key={ord.id_orden}
                className="p-4 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-tech text-xs font-bold text-[var(--text-primary)]">
                    OT-#{ord.id_orden} · {formatDateTime(ord.fecha_ingreso)}
                  </span>
                  <Badge tone={ord.estado === 'CERRADA' ? 'ok' : 'accent'} dot>
                    {ord.estado}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{ord.diagnostico}</p>
                <div className="flex items-center justify-between text-xs font-mono-tech pt-2 border-t border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)]">Mecánico: {ord.mecanico_nombre}</span>
                  <span className="font-bold text-[var(--accent)]">
                    Repuestos: {formatCurrency(ord.total_repuestos)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
