import { useMemo, useState, type FormEvent } from 'react';
import { Filter, Package, Search } from 'lucide-react';
import { getPermissionsForRole } from '../../config/roles.config';
import { useAuthStore, useInventoryStore, useNavigationStore } from '../../store';
import type { Producto } from '../../types/models';
import { formatCurrency, getStockHealth, getStockPercentage } from '../../utils/formatters';
import {
  Badge,
  BaseButton,
  CancelButton,
  Card,
  ConfirmDialog,
  CreateButton,
  DeleteButton,
  EditButton,
  EmptyState,
  FormInput,
  FormSelect,
  FormTextarea,
  Modal,
  PageHeader,
  RefreshButton,
  SaveButton,
  StockMovementButton,
} from '../../components/ui';

interface ProductFormState {
  nombre: string;
  unidad_medida: string;
  precio_unitario: string;
  descripcion: string;
  stock_actual: string;
  nivel_minimo: string;
  id_categoria: string;
}

const EMPTY_FORM: ProductFormState = {
  nombre: '',
  unidad_medida: 'Unidad',
  precio_unitario: '',
  descripcion: '',
  stock_actual: '0',
  nivel_minimo: '4',
  id_categoria: '1',
};

export function ProductosView() {
  const usuario = useAuthStore((s) => s.usuario);
  const perms = getPermissionsForRole(usuario?.nombre_rol);

  const productos = useInventoryStore((s) => s.productos);
  const categorias = useInventoryStore((s) => s.categorias);
  const loading = useInventoryStore((s) => s.loading);
  const searchQuery = useInventoryStore((s) => s.searchQuery);
  const selectedCategoriaId = useInventoryStore((s) => s.selectedCategoriaId);
  const soloStockBajo = useInventoryStore((s) => s.soloStockBajo);
  const setSearchQuery = useInventoryStore((s) => s.setSearchQuery);
  const setSelectedCategoriaId = useInventoryStore((s) => s.setSelectedCategoriaId);
  const setSoloStockBajo = useInventoryStore((s) => s.setSoloStockBajo);
  const fetchInventoryAll = useInventoryStore((s) => s.fetchInventoryAll);
  const createProducto = useInventoryStore((s) => s.createProducto);
  const updateProducto = useInventoryStore((s) => s.updateProducto);
  const deleteProducto = useInventoryStore((s) => s.deleteProducto);
  const setActiveSection = useNavigationStore((s) => s.setActiveSection);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Producto | null>(null);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return productos.filter((p) => {
      if (selectedCategoriaId !== 'TODAS' && p.id_categoria !== selectedCategoriaId) return false;
      if (soloStockBajo && !p.stock_bajo) return false;
      if (!q) return true;
      return (
        p.nombre.toLowerCase().includes(q) ||
        p.descripcion.toLowerCase().includes(q) ||
        (p.categoria_nombre ?? '').toLowerCase().includes(q)
      );
    });
  }, [productos, searchQuery, selectedCategoriaId, soloStockBajo]);

  const openCreateModal = () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      id_categoria: categorias[0] ? String(categorias[0].id_categoria) : '1',
    });
    setModalOpen(true);
  };

  const openEditModal = (prod: Producto) => {
    setEditing(prod);
    setForm({
      nombre: prod.nombre,
      unidad_medida: prod.unidad_medida,
      precio_unitario: String(prod.precio_unitario),
      descripcion: prod.descripcion,
      stock_actual: String(prod.stock_actual),
      nivel_minimo: String(prod.nivel_minimo),
      id_categoria: String(prod.id_categoria),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      nombre: form.nombre,
      unidad_medida: form.unidad_medida,
      precio_unitario: Number(form.precio_unitario),
      descripcion: form.descripcion,
      stock_actual: Number(form.stock_actual),
      nivel_minimo: Number(form.nivel_minimo),
      id_categoria: Number(form.id_categoria),
    };
    const ok = editing
      ? await updateProducto(editing.id_producto, payload)
      : await createProducto(payload);
    setSaving(false);
    if (ok) setModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    setSaving(true);
    const ok = await deleteProducto(toDelete.id_producto);
    setSaving(false);
    if (ok) setToDelete(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="04 / MÓDULO INVENTARIO · TABLA PRODUCTOS"
        title="Catálogo de Repuestos y Stock"
        description={
          perms.canManageProducts
            ? 'Registra, edita o elimina productos del taller y supervisa el umbral de stock mínimo en tiempo real.'
            : 'Consulta disponibilidad de repuestos, precios unitarios y niveles de stock mínimo en tiempo real (solo lectura para tu rol).'
        }
        actions={
          <>
            <RefreshButton spinning={loading} onClick={() => void fetchInventoryAll()} />
            {perms.canRegisterMovements && (
              <StockMovementButton
                tipo="ENTRADA"
                size="sm"
                label="Movimientos"
                onClick={() => setActiveSection('movimientos')}
              />
            )}
            {perms.canManageProducts && (
              <CreateButton size="sm" label="Registrar Producto" onClick={openCreateModal} />
            )}
          </>
        }
      />

      {/* Barra de filtros */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-5 relative">
            <FormInput
              label="Buscar repuesto o descripción"
              placeholder="Ej. Aceite 5W-30, Brembo, Filtro Bosch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-[33px] pointer-events-none" />
          </div>

          <div className="md:col-span-4">
            <FormSelect
              label="Filtrar por categoría"
              value={selectedCategoriaId === 'TODAS' ? 'TODAS' : String(selectedCategoriaId)}
              onChange={(e) =>
                setSelectedCategoriaId(e.target.value === 'TODAS' ? 'TODAS' : Number(e.target.value))
              }
              options={[
                { value: 'TODAS', label: 'Todas las categorías' },
                ...categorias.map((c) => ({
                  value: String(c.id_categoria),
                  label: `${c.nombre} (${c.total_productos ?? 0})`,
                })),
              ]}
            />
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <BaseButton
              variant={soloStockBajo ? 'primary' : 'secondary'}
              size="md"
              fullWidth
              leftIcon={<Filter className="w-4 h-4" />}
              onClick={() => setSoloStockBajo(!soloStockBajo)}
            >
              {soloStockBajo ? 'Mostrando Stock Bajo' : 'Solo Stock Bajo'}
            </BaseButton>
          </div>
        </div>
      </Card>

      {/* Tabla de productos */}
      <Card
        index={`CATÁLOGO · ${filtered.length} ÍTEMS`}
        title="Existencias en Almacén"
        noPadding
      >
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Sin repuestos coincidentes"
              description="Ajusta los filtros de búsqueda o registra un nuevo producto en SQLite."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 font-mono-tech text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Repuesto / Descripción</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Precio Unit.</th>
                  <th className="py-3 px-4">Stock / Mínimo</th>
                  <th className="py-3 px-4">Estado</th>
                  {perms.canManageProducts && <th className="py-3 px-4 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-sm">
                {filtered.map((prod) => {
                  const health = getStockHealth(prod.stock_actual, prod.nivel_minimo);
                  const pct = getStockPercentage(prod.stock_actual, prod.nivel_minimo);
                  const barColor =
                    health === 'optimo'
                      ? 'var(--status-ok)'
                      : health === 'preventivo'
                        ? 'var(--status-warn)'
                        : 'var(--accent)';

                  return (
                    <tr
                      key={prod.id_producto}
                      className="hover:bg-[var(--bg-elevated)]/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono-tech text-xs text-[var(--text-muted)]">
                        #{String(prod.id_producto).padStart(3, '0')}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
                          <Package className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                          <span>{prod.nombre}</span>
                        </div>
                        <div className="text-xs text-[var(--text-muted)] line-clamp-1 mt-0.5">
                          {prod.descripcion}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge tone="neutral" pill={false}>
                          {prod.categoria_nombre}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-mono-tech font-semibold text-[var(--text-primary)]">
                        {formatCurrency(prod.precio_unitario)}
                        <span className="text-[10px] font-normal text-[var(--text-muted)] ml-1">
                          / {prod.unidad_medida}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 min-w-[160px]">
                        <div className="flex items-baseline justify-between font-mono-tech text-xs mb-1.5">
                          <span className="font-bold text-[var(--text-primary)]">
                            {prod.stock_actual} {prod.unidad_medida}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            Mín: {prod.nivel_minimo}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[var(--bg-muted)] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: barColor }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          tone={
                            health === 'optimo'
                              ? 'ok'
                              : health === 'preventivo'
                                ? 'warn'
                                : 'danger'
                          }
                          dot
                        >
                          {health === 'agotado'
                            ? 'AGOTADO'
                            : health === 'critico'
                              ? 'STOCK BAJO'
                              : health === 'preventivo'
                                ? 'PREVENTIVO'
                                : 'ÓPTIMO'}
                        </Badge>
                      </td>
                      {perms.canManageProducts && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <EditButton onClick={() => openEditModal(prod)} />
                            <DeleteButton onClick={() => setToDelete(prod)} />
                          </div>
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

      {/* Modal Crear / Editar Producto */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        eyebrow={editing ? 'CU: EDITAR PRODUCTO' : 'CU: REGISTRAR PRODUCTO'}
        title={editing ? `Editar ${editing.nombre}` : 'Registrar Nuevo Repuesto'}
        subtitle="Persiste directamente en la tabla productos de SQLite y valida el umbral mínimo."
        footer={
          <>
            <CancelButton onClick={() => setModalOpen(false)} disabled={saving} />
            <SaveButton
              form="product-form"
              loading={saving}
              label={editing ? 'Guardar Cambios' : 'Registrar Producto'}
            />
          </>
        }
      >
        <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Nombre del repuesto *"
            required
            maxLength={80}
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Ej. Filtro de Aceite Bosch P3312"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Categoría *"
              value={form.id_categoria}
              onChange={(e) => setForm({ ...form, id_categoria: e.target.value })}
              options={categorias.map((c) => ({ value: String(c.id_categoria), label: c.nombre }))}
            />
            <FormSelect
              label="Unidad de medida *"
              value={form.unidad_medida}
              onChange={(e) => setForm({ ...form, unidad_medida: e.target.value })}
              options={[
                { value: 'Unidad', label: 'Unidad' },
                { value: 'Juego', label: 'Juego' },
                { value: 'Kit', label: 'Kit' },
                { value: 'Litro', label: 'Litro' },
                { value: 'Galón', label: 'Galón' },
                { value: 'Par', label: 'Par' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormInput
              label="Precio unitario ($) *"
              type="number"
              step="0.01"
              min="0"
              required
              value={form.precio_unitario}
              onChange={(e) => setForm({ ...form, precio_unitario: e.target.value })}
            />
            <FormInput
              label="Stock actual *"
              type="number"
              min="0"
              required
              value={form.stock_actual}
              onChange={(e) => setForm({ ...form, stock_actual: e.target.value })}
            />
            <FormInput
              label="Nivel mínimo *"
              type="number"
              min="0"
              required
              value={form.nivel_minimo}
              onChange={(e) => setForm({ ...form, nivel_minimo: e.target.value })}
              hint="Genera alerta si stock <= mínimo"
            />
          </div>

          <FormTextarea
            label="Descripción técnica"
            maxLength={200}
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Especificaciones, compatibilidad de modelos o marca OEM..."
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={handleConfirmDelete}
        loading={saving}
        title="Eliminar Producto del Catálogo"
        description={`¿Deseas eliminar "${toDelete?.nombre ?? ''}"? Solo se permite eliminar productos sin historial de movimientos ni órdenes asociadas.`}
        confirmLabel="Sí, eliminar producto"
      />
    </div>
  );
}
