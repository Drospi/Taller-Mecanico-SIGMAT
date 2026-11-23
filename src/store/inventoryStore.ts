import { create } from 'zustand';
import type {
  AlertaStock,
  Categoria,
  DashboardResumen,
  MovimientoInventario,
  Producto,
  TipoMovimiento,
} from '../types/models';
import { apiRequest } from '../utils/apiClient';
import { useToastStore } from './toastStore';

interface InventoryState {
  categorias: Categoria[];
  productos: Producto[];
  movimientos: MovimientoInventario[];
  alertas: AlertaStock[];
  dashboard: DashboardResumen | null;
  loading: boolean;
  searchQuery: string;
  selectedCategoriaId: number | 'TODAS';
  soloStockBajo: boolean;

  setSearchQuery: (q: string) => void;
  setSelectedCategoriaId: (id: number | 'TODAS') => void;
  setSoloStockBajo: (val: boolean) => void;

  fetchInventoryAll: () => Promise<void>;
  fetchDashboard: () => Promise<void>;

  createCategoria: (payload: { nombre: string; descripcion: string }) => Promise<boolean>;
  updateCategoria: (id: number, payload: { nombre: string; descripcion: string }) => Promise<boolean>;
  deleteCategoria: (id: number) => Promise<boolean>;
  fetchProductosPorCategoria: (id: number) => Promise<Producto[]>;

  createProducto: (payload: {
    nombre: string;
    unidad_medida: string;
    precio_unitario: number;
    descripcion: string;
    stock_actual: number;
    nivel_minimo: number;
    id_categoria: number;
  }) => Promise<boolean>;
  updateProducto: (
    id: number,
    payload: {
      nombre: string;
      unidad_medida: string;
      precio_unitario: number;
      descripcion: string;
      stock_actual: number;
      nivel_minimo: number;
      id_categoria: number;
    }
  ) => Promise<boolean>;
  deleteProducto: (id: number) => Promise<boolean>;

  registrarMovimiento: (payload: {
    tipo_movimiento: TipoMovimiento;
    id_producto: number;
    cantidad: number;
    motivo: string;
    id_orden?: number | null;
  }) => Promise<{ ok: boolean; alertaGenerada?: AlertaStock | null }>;

  anularMovimiento: (id_movimiento: number) => Promise<boolean>;
  resolverAlerta: (id_alerta: number) => Promise<boolean>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  categorias: [],
  productos: [],
  movimientos: [],
  alertas: [],
  dashboard: null,
  loading: false,
  searchQuery: '',
  selectedCategoriaId: 'TODAS',
  soloStockBajo: false,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategoriaId: (selectedCategoriaId) => set({ selectedCategoriaId }),
  setSoloStockBajo: (soloStockBajo) => set({ soloStockBajo }),

  fetchDashboard: async () => {
    try {
      const dashboard = await apiRequest<DashboardResumen>('/dashboard');
      set({ dashboard });
    } catch {
      // handled silently on background refresh
    }
  },

  fetchInventoryAll: async () => {
    set({ loading: true });
    try {
      const [categorias, productos, movimientos, alertas, dashboard] = await Promise.all([
        apiRequest<Categoria[]>('/categorias'),
        apiRequest<Producto[]>('/productos'),
        apiRequest<MovimientoInventario[]>('/movimientos'),
        apiRequest<AlertaStock[]>('/alertas'),
        apiRequest<DashboardResumen>('/dashboard'),
      ]);
      set({ categorias, productos, movimientos, alertas, dashboard, loading: false });
    } catch (err) {
      set({ loading: false });
      useToastStore.getState().pushToast({
        variant: 'error',
        title: 'Error cargando inventario',
        description: err instanceof Error ? err.message : 'Fallo al consultar SQLite.',
      });
    }
  },

  createCategoria: async (payload) => {
    try {
      await apiRequest<Categoria>('/categorias', { method: 'POST', body: payload });
      await get().fetchInventoryAll();
      useToastStore.getState().pushToast({
        variant: 'success',
        title: 'Categoría registrada',
        description: `"${payload.nombre}" se guardó en SQLite.`,
      });
      return true;
    } catch (err) {
      useToastStore.getState().pushToast({
        variant: 'error',
        title: 'No se pudo crear categoría',
        description: err instanceof Error ? err.message : 'Error inesperado.',
      });
      return false;
    }
  },

  updateCategoria: async (id, payload) => {
    try {
      await apiRequest<Categoria>(`/categorias/${id}`, { method: 'PUT', body: payload });
      await get().fetchInventoryAll();
      useToastStore.getState().pushToast({
        variant: 'success',
        title: 'Categoría actualizada',
        description: `Los cambios de "${payload.nombre}" fueron guardados.`,
      });
      return true;
    } catch (err) {
      useToastStore.getState().pushToast({
        variant: 'error',
        title: 'Error al actualizar categoría',
        description: err instanceof Error ? err.message : 'Error inesperado.',
      });
      return false;
    }
  },

  deleteCategoria: async (id) => {
    try {
      await apiRequest(`/categorias/${id}`, { method: 'DELETE' });
      await get().fetchInventoryAll();
      useToastStore.getState().pushToast({
        variant: 'success',
        title: 'Categoría eliminada',
        description: 'La categoría fue removida del catálogo.',
      });
      return true;
    } catch (err) {
      useToastStore.getState().pushToast({
        variant: 'error',
        title: 'Operación rechazada',
        description: err instanceof Error ? err.message : 'No se pudo eliminar.',
      });
      return false;
    }
  },

  fetchProductosPorCategoria: async (id) => {
    return apiRequest<Producto[]>(`/categorias/${id}/productos`);
  },

  createProducto: async (payload) => {
    try {
      await apiRequest<Producto>('/productos', { method: 'POST', body: payload });
      await get().fetchInventoryAll();
      useToastStore.getState().pushToast({
        variant: 'success',
        title: 'Producto registrado',
        description: `"${payload.nombre}" añadido al inventario SQLite.`,
      });
      return true;
    } catch (err) {
      useToastStore.getState().pushToast({
        variant: 'error',
        title: 'No se pudo registrar producto',
        description: err instanceof Error ? err.message : 'Error inesperado.',
      });
      return false;
    }
  },

  updateProducto: async (id, payload) => {
    try {
      await apiRequest<Producto>(`/productos/${id}`, { method: 'PUT', body: payload });
      await get().fetchInventoryAll();
      useToastStore.getState().pushToast({
        variant: 'success',
        title: 'Producto actualizado',
        description: `Se actualizaron los datos de "${payload.nombre}".`,
      });
      return true;
    } catch (err) {
      useToastStore.getState().pushToast({
        variant: 'error',
        title: 'Error al actualizar producto',
        description: err instanceof Error ? err.message : 'Error inesperado.',
      });
      return false;
    }
  },

  deleteProducto: async (id) => {
    try {
      await apiRequest(`/productos/${id}`, { method: 'DELETE' });
      await get().fetchInventoryAll();
      useToastStore.getState().pushToast({
        variant: 'success',
        title: 'Producto eliminado',
        description: 'El repuesto fue eliminado del catálogo.',
      });
      return true;
    } catch (err) {
      useToastStore.getState().pushToast({
        variant: 'error',
        title: 'No se pudo eliminar',
        description: err instanceof Error ? err.message : 'Tiene historial asociado.',
      });
      return false;
    }
  },

  registrarMovimiento: async (payload) => {
    try {
      const res = await apiRequest<{
        movimiento: MovimientoInventario;
        producto: Producto;
        alertaGenerada: AlertaStock | null;
      }>('/movimientos', { method: 'POST', body: payload });
      await get().fetchInventoryAll();

      useToastStore.getState().pushToast({
        variant: 'success',
        title: `${payload.tipo_movimiento === 'ENTRADA' ? 'Entrada' : 'Salida'} registrada (#${res.movimiento.id_movimiento})`,
        description: `${res.producto.nombre}: stock actualizado a ${res.producto.stock_actual} ${res.producto.unidad_medida}(s).`,
      });

      if (res.alertaGenerada) {
        useToastStore.getState().pushToast({
          variant: 'warning',
          title: 'Alerta de stock mínimo generada',
          description: `"${res.producto.nombre}" alcanzó nivel crítico (${res.producto.stock_actual} ≤ ${res.producto.nivel_minimo}).`,
        });
      }

      return { ok: true, alertaGenerada: res.alertaGenerada };
    } catch (err) {
      useToastStore.getState().pushToast({
        variant: 'error',
        title: 'Movimiento rechazado',
        description: err instanceof Error ? err.message : 'Error al registrar movimiento.',
      });
      return { ok: false };
    }
  },

  anularMovimiento: async (id_movimiento) => {
    try {
      await apiRequest(`/movimientos/${id_movimiento}/anular`, { method: 'POST' });
      await get().fetchInventoryAll();
      useToastStore.getState().pushToast({
        variant: 'info',
        title: `Movimiento #${id_movimiento} anulado`,
        description: 'El stock del producto fue revertido automáticamente en SQLite.',
      });
      return true;
    } catch (err) {
      useToastStore.getState().pushToast({
        variant: 'error',
        title: 'No se pudo anular',
        description: err instanceof Error ? err.message : 'Error inesperado.',
      });
      return false;
    }
  },

  resolverAlerta: async (id_alerta) => {
    try {
      await apiRequest(`/alertas/${id_alerta}/resolver`, { method: 'POST' });
      await get().fetchInventoryAll();
      useToastStore.getState().pushToast({
        variant: 'success',
        title: `Alerta #${id_alerta} resuelta`,
        description: 'Estado cambiado a RESUELTA en la tabla alertas_stock.',
      });
      return true;
    } catch (err) {
      useToastStore.getState().pushToast({
        variant: 'error',
        title: 'Error al resolver alerta',
        description: err instanceof Error ? err.message : 'Error inesperado.',
      });
      return false;
    }
  },
}));
