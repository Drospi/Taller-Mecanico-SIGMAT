import { useState, type FormEvent } from 'react';
import { FolderTree, Package } from 'lucide-react';
import { getPermissionsForRole } from '../../config/roles.config';
import { useAuthStore, useInventoryStore } from '../../store';
import type { Categoria, Producto } from '../../types/models';
import { formatCurrency } from '../../utils/formatters';
import {
  Badge,
  CancelButton,
  Card,
  ConfirmDialog,
  CreateButton,
  DeleteButton,
  EditButton,
  FormInput,
  FormTextarea,
  Modal,
  PageHeader,
  RefreshButton,
  SaveButton,
  ViewDetailButton,
} from '../../components/ui';

export function CategoriasView() {
  const usuario = useAuthStore((s) => s.usuario);
  const perms = getPermissionsForRole(usuario?.nombre_rol);

  const categorias = useInventoryStore((s) => s.categorias);
  const loading = useInventoryStore((s) => s.loading);
  const fetchInventoryAll = useInventoryStore((s) => s.fetchInventoryAll);
  const createCategoria = useInventoryStore((s) => s.createCategoria);
  const updateCategoria = useInventoryStore((s) => s.updateCategoria);
  const deleteCategoria = useInventoryStore((s) => s.deleteCategoria);
  const fetchProductosPorCategoria = useInventoryStore((s) => s.fetchProductosPorCategoria);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState<Categoria | null>(null);
  const [inspecting, setInspecting] = useState<Categoria | null>(null);
  const [catProducts, setCatProducts] = useState<Producto[]>([]);

  const openCreate = () => {
    setEditing(null);
    setNombre('');
    setDescripcion('');
    setModalOpen(true);
  };

  const openEdit = (cat: Categoria) => {
    setEditing(cat);
    setNombre(cat.nombre);
    setDescripcion(cat.descripcion);
    setModalOpen(true);
  };

  const handleInspect = async (cat: Categoria) => {
    setInspecting(cat);
    const list = await fetchProductosPorCategoria(cat.id_categoria);
    setCatProducts(list);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ok = editing
      ? await updateCategoria(editing.id_categoria, { nombre, descripcion })
      : await createCategoria({ nombre, descripcion });
    setSaving(false);
    if (ok) setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setSaving(true);
    const ok = await deleteCategoria(toDelete.id_categoria);
    setSaving(false);
    if (ok) setToDelete(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="07 / CU: GESTIONAR CATEGORÍAS · TABLA CATEGORIAS"
        title="Categorías de Repuestos"
        description="Organiza la taxonomía del catálogo de productos. Implementa Categoria.registrar(), editar(), eliminar() y listarProductos()."
        actions={
          <>
            <RefreshButton spinning={loading} onClick={() => void fetchInventoryAll()} />
            {perms.canManageCategories && (
              <CreateButton size="sm" label="Nueva Categoría" onClick={openCreate} />
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {categorias.map((cat, idx) => (
          <Card
            key={cat.id_categoria}
            index={`CAT ${String(idx + 1).padStart(2, '0')}`}
            dotColor={idx % 3 === 0 ? '#F2491E' : idx % 3 === 1 ? '#CFD4DD' : '#8CE043'}
            title={cat.nombre}
            headerRight={
              <Badge tone="accent" pill>
                {cat.total_productos ?? 0} PROD.
              </Badge>
            }
          >
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed min-h-[42px]">
              {cat.descripcion || 'Sin descripción registrada.'}
            </p>

            <div className="mt-4 pt-3.5 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
              <ViewDetailButton
                label="Listar productos"
                onClick={() => void handleInspect(cat)}
              />
              {perms.canManageCategories && (
                <div className="flex items-center gap-1.5">
                  <EditButton iconOnly onClick={() => openEdit(cat)} />
                  <DeleteButton iconOnly onClick={() => setToDelete(cat)} />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Modal Crear/Editar */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        eyebrow={editing ? 'EDITAR CATEGORÍA' : 'REGISTRAR CATEGORÍA'}
        title={editing ? `Editar: ${editing.nombre}` : 'Nueva Categoría de Inventario'}
        footer={
          <>
            <CancelButton onClick={() => setModalOpen(false)} disabled={saving} />
            <SaveButton form="cat-form" loading={saving} />
          </>
        }
      >
        <form id="cat-form" onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Nombre de la categoría *"
            required
            maxLength={50}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Sistema de Refrigeración"
          />
          <FormTextarea
            label="Descripción *"
            required
            maxLength={150}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Detalle de los repuestos clasificados en esta familia..."
          />
        </form>
      </Modal>

      {/* Modal listarProductos() */}
      <Modal
        open={Boolean(inspecting)}
        onClose={() => setInspecting(null)}
        eyebrow="CATEGORIA.LISTARPRODUCTOS()"
        title={inspecting?.nombre ?? ''}
        subtitle={inspecting?.descripcion}
        size="lg"
      >
        {catProducts.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--text-secondary)] flex flex-col items-center gap-2">
            <FolderTree className="w-6 h-6 text-[var(--accent)]" />
            Esta categoría aún no tiene productos asignados.
          </div>
        ) : (
          <div className="space-y-2">
            {catProducts.map((p) => (
              <div
                key={p.id_producto}
                className="p-3 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                    <Package className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                    <span className="truncate">{p.nombre}</span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">{p.descripcion}</div>
                </div>
                <div className="text-right font-mono-tech shrink-0">
                  <div className="text-xs font-bold text-[var(--text-primary)]">
                    {formatCurrency(p.precio_unitario)}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    Stock: {p.stock_actual} {p.unidad_medida}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        loading={saving}
        title="Eliminar Categoría"
        description={`¿Deseas eliminar la categoría "${toDelete?.nombre ?? ''}"? SQLite impedirá eliminarla si contiene productos asociados.`}
        confirmLabel="Eliminar categoría"
      />
    </div>
  );
}
