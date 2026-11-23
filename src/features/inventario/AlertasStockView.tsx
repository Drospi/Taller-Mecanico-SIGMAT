import { useState, type FormEvent } from 'react';
import { AlertTriangle, CheckCircle2, PackagePlus } from 'lucide-react';
import { getPermissionsForRole } from '../../config/roles.config';
import { useAuthStore, useInventoryStore } from '../../store';
import type { AlertaStock } from '../../types/models';
import { formatDateTime } from '../../utils/formatters';
import {
  Badge,
  BaseButton,
  CancelButton,
  Card,
  EmptyState,
  FormInput,
  Modal,
  PageHeader,
  RefreshButton,
  ResolveAlertButton,
  SaveButton,
  StatCard,
} from '../../components/ui';

export function AlertasStockView() {
  const usuario = useAuthStore((s) => s.usuario);
  const perms = getPermissionsForRole(usuario?.nombre_rol);

  const alertas = useInventoryStore((s) => s.alertas);
  const loading = useInventoryStore((s) => s.loading);
  const fetchInventoryAll = useInventoryStore((s) => s.fetchInventoryAll);
  const resolverAlerta = useInventoryStore((s) => s.resolverAlerta);
  const registrarMovimiento = useInventoryStore((s) => s.registrarMovimiento);

  const [filtro, setFiltro] = useState<'TODAS' | 'PENDIENTE' | 'RESUELTA'>('TODAS');
  const [reponerAlerta, setReponerAlerta] = useState<AlertaStock | null>(null);
  const [cantidadReponer, setCantidadReponer] = useState('10');
  const [motivoReponer, setMotivoReponer] = useState('Reposición automática por alerta de stock mínimo');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [savingRestock, setSavingRestock] = useState(false);

  const pendientes = alertas.filter((a) => a.estado === 'PENDIENTE');
  const resueltas = alertas.filter((a) => a.estado === 'RESUELTA');

  const filtered = alertas.filter((a) => (filtro === 'TODAS' ? true : a.estado === filtro));

  const handleResolve = async (id_alerta: number) => {
    setProcessingId(id_alerta);
    await resolverAlerta(id_alerta);
    setProcessingId(null);
  };

  const handleOpenRestock = (alerta: AlertaStock) => {
    const deficit = Math.max(5, ((alerta.nivel_minimo ?? 5) - (alerta.stock_actual ?? 0)) + 5);
    setCantidadReponer(String(deficit));
    setMotivoReponer(`Reposición de almacén — Resolución Alerta #${alerta.id_alerta}`);
    setReponerAlerta(alerta);
  };

  const handleRestockSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reponerAlerta) return;
    setSavingRestock(true);
    const res = await registrarMovimiento({
      tipo_movimiento: 'ENTRADA',
      id_producto: reponerAlerta.id_producto,
      cantidad: Number(cantidadReponer),
      motivo: motivoReponer,
    });
    setSavingRestock(false);
    if (res.ok) {
      setReponerAlerta(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="06 / CONTROLADOR ALERTA STOCK · TABLA ALERTAS_STOCK"
        title="Alertas de Stock Mínimo"
        description="Alertas disparadas automáticamente por ControladorAlertaStock cuando stock_actual <= nivel_minimo. Repón stock o resuelve alertas atendidas."
        actions={<RefreshButton spinning={loading} onClick={() => void fetchInventoryAll()} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          index="ALERTAS 01"
          label="Alertas Pendientes"
          value={pendientes.length}
          dotColor="#F2491E"
          icon={<AlertTriangle className="w-4 h-4" />}
        />
        <StatCard
          index="ALERTAS 02"
          label="Alertas Resueltas"
          value={resueltas.length}
          dotColor="#8CE043"
          icon={<CheckCircle2 className="w-4 h-4" />}
        />
        <StatCard
          index="ALERTAS 03"
          label="Total Histórico"
          value={alertas.length}
          dotColor="#CFD4DD"
        />
      </div>

      <Card
        index={`REGISTROS · ${filtered.length}`}
        title="Listado de Alertas de Inventario"
        headerRight={
          <div className="flex items-center gap-1.5">
            {(['TODAS', 'PENDIENTE', 'RESUELTA'] as const).map((st) => (
              <BaseButton
                key={st}
                size="xs"
                variant={filtro === st ? 'primary' : 'secondary'}
                onClick={() => setFiltro(st)}
              >
                {st}
              </BaseButton>
            ))}
          </div>
        }
        noPadding
      >
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No hay alertas bajo este filtro"
              description="Cuando algún repuesto alcance o baje de su nivel mínimo, aparecerá aquí automáticamente."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 font-mono-tech text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Fecha Generada</th>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Stock vs Mínimo</th>
                  <th className="py-3 px-4">Estado</th>
                  {perms.canResolveAlerts && <th className="py-3 px-4 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-sm">
                {filtered.map((alerta) => {
                  const isPending = alerta.estado === 'PENDIENTE';
                  return (
                    <tr key={alerta.id_alerta} className="hover:bg-[var(--bg-elevated)]/40">
                      <td className="py-3.5 px-4 font-mono-tech text-xs text-[var(--text-muted)]">
                        ALR-#{alerta.id_alerta}
                      </td>
                      <td className="py-3.5 px-4 font-mono-tech text-xs text-[var(--text-secondary)]">
                        {formatDateTime(alerta.fecha_generada)}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[var(--text-primary)]">
                        {alerta.producto_nombre}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge tone="neutral" pill={false}>
                          {alerta.categoria_nombre}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-mono-tech text-xs">
                        <span
                          className={
                            (alerta.stock_actual ?? 0) <= (alerta.nivel_minimo ?? 0)
                              ? 'text-[var(--accent)] font-bold'
                              : 'text-[var(--status-ok)] font-bold'
                          }
                        >
                          {alerta.stock_actual}
                        </span>{' '}
                        / {alerta.nivel_minimo} {alerta.unidad_medida}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge tone={isPending ? 'danger' : 'ok'} dot>
                          {alerta.estado}
                        </Badge>
                      </td>
                      {perms.canResolveAlerts && (
                        <td className="py-3.5 px-4 text-right">
                          {isPending ? (
                            <div className="inline-flex items-center gap-2">
                              {perms.canRegisterMovements && (
                                <BaseButton
                                  size="xs"
                                  variant="outline-accent"
                                  leftIcon={<PackagePlus className="w-3.5 h-3.5" />}
                                  onClick={() => handleOpenRestock(alerta)}
                                >
                                  Reponer
                                </BaseButton>
                              )}
                              <ResolveAlertButton
                                size="xs"
                                loading={processingId === alerta.id_alerta}
                                onClick={() => void handleResolve(alerta.id_alerta)}
                              />
                            </div>
                          ) : (
                            <span className="font-mono-tech text-[11px] text-[var(--text-muted)]">
                              ATENDIDA
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(reponerAlerta)}
        onClose={() => setReponerAlerta(null)}
        eyebrow="REPOSICIÓN RÁPIDA — ENTRADA DE INVENTARIO"
        title={`Reponer: ${reponerAlerta?.producto_nombre ?? ''}`}
        subtitle="Al registrar una entrada que supere el nivel mínimo, la alerta se resuelve automáticamente."
        footer={
          <>
            <CancelButton onClick={() => setReponerAlerta(null)} disabled={savingRestock} />
            <SaveButton
              form="restock-form"
              loading={savingRestock}
              label="Registrar Entrada y Resolver"
            />
          </>
        }
      >
        <form id="restock-form" onSubmit={handleRestockSubmit} className="space-y-4">
          <FormInput
            label="Cantidad a ingresar *"
            type="number"
            min="1"
            required
            value={cantidadReponer}
            onChange={(e) => setCantidadReponer(e.target.value)}
            hint={`Stock actual: ${reponerAlerta?.stock_actual ?? 0} · Nivel mínimo: ${reponerAlerta?.nivel_minimo ?? 0}`}
          />
          <FormInput
            label="Motivo de ingreso *"
            required
            value={motivoReponer}
            onChange={(e) => setMotivoReponer(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
}
