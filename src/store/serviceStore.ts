import { create } from 'zustand';
import type {
  AsignacionRepuestoResult,
  DetalleOrdenRepuesto,
  OrdenTrabajo,
  Vehiculo,
} from '../types/models';
import { apiRequest } from '../utils/apiClient';
import { useInventoryStore } from './inventoryStore';
import { useToastStore } from './toastStore';

interface ServiceState {
  vehiculos: Vehiculo[];
  ordenes: OrdenTrabajo[];
  repuestosPorOrden: Record<number, DetalleOrdenRepuesto[]>;
  loading: boolean;
  filtroEstadoOrden: 'TODOS' | 'ABIERTA' | 'EN_PROCESO' | 'CERRADA';
  searchOrdenQuery: string;

  setFiltroEstadoOrden: (estado: 'TODOS' | 'ABIERTA' | 'EN_PROCESO' | 'CERRADA') => void;
  setSearchOrdenQuery: (q: string) => void;

  fetchServiceAll: () => Promise<void>;
  fetchRepuestosOrden: (id_orden: number) => Promise<DetalleOrdenRepuesto[]>;

  createVehiculo: (payload: {
    placa: string;
    marca: string;
    modelo: string;
    anio: number;
    propietario_nombre: string;
    propietario_telefono: string;
  }) => Promise<Vehiculo | null>;

  updateVehiculo: (
    id_vehiculo: number,
    payload: {
      placa: string;
      marca: string;
      modelo: string;
      anio: number;
      propietario_nombre: string;
      propietario_telefono: string;
    }
  ) => Promise<boolean>;

  fetchHistorialVehiculo: (id_vehiculo: number) => Promise<OrdenTrabajo[]>;

  abrirOrden: (payload: {
    id_vehiculo: number;
    diagnostico: string;
    id_mecanico?: number;
  }) => Promise<OrdenTrabajo | null>;

  actualizarDiagnostico: (
    id_orden: number,
    diagnostico: string,
    estado?: 'ABIERTA' | 'EN_PROCESO'
  ) => Promise<boolean>;

  cerrarOrden: (id_orden: number) => Promise<boolean>;

  asignarRepuestoAOrden: (payload: {
    id_orden: number;
    id_producto: number;
    cantidad: number;
    motivo?: string;
  }) => Promise<{ ok: boolean; result?: AsignacionRepuestoResult; error?: string }>;
}

export const useServiceStore = create<ServiceState>((set, get) => ({
  vehiculos: [],
  ordenes: [],
  repuestosPorOrden: {},
  loading: false,
  filtroEstadoOrden: 'TODOS',
  searchOrdenQuery: '',

  setFiltroEstadoOrden: (filtroEstadoOrden) => set({ filtroEstadoOrden }),
  setSearchOrdenQuery: (searchOrdenQuery) => set({ searchOrdenQuery }),

  fetchServiceAll: async () => {
    set({ loading: true });
    try {
      const [vehiculos, ordenes] = await Promise.all([
        apiRequest<Vehiculo[]>('/vehiculos'),
        apiRequest<OrdenTrabajo[]>('/ordenes'),
      ]);
      set({ vehiculos, ordenes, loading: false });
    } catch (err) {
      set({ loading: false });
      useToastStore.getState().pushToast({
        variant: 'error',
        title: 'Error cargando servicio técnico',
        description: err instanceof Error ? err.message : 'No se pudieron obtener órdenes.',
      });
    }
  },

  fetchRepuestosOrden: async (id_orden) => {
    const items = await apiRequest<DetalleOrdenRepuesto[]>(`/ordenes/${id_orden}/repuestos`);
    set((state) => ({
      repuestosPorOrden: { ...state.repuestosPorOrden, [id_orden]: items },
    }));
    return items;
  },

  createVehiculo: async (payload) => {
    try {
      const created = await apiRequest<Vehiculo>('/vehiculos', { method: 'POST', body: payload });
      await get().fetchServiceAll();
      await useInventoryStore.getState().fetchDashboard();
      useToastStore.getState().pushToast({
        variant: 'success',
        title: `Vehículo ${created.placa} registrado`,
        description: `${created.marca} ${created.modelo} (${created.anio}) listo para ingreso.`,
      });
      return created;
    } catch (err) {
      useToastStore.getState().pushToast({
        variant: 'error',
        title: 'No se pudo registrar vehículo',
        description: err instanceof Error ? err.message : 'Verifique los datos ingresados.',
      });
      return null;
    }
  },

  updateVehiculo: async (id_vehiculo, payload) => {
    try {
      await apiRequest<Vehiculo>(`/vehiculos/${id_vehiculo}`, { method: 'PUT', body: payload });
      await get().fetchServiceAll();
      useToastStore.getState().pushToast({
        variant: 'success',
        title: 'Vehículo actualizado',
        description: `Ficha técnica de placa ${payload.placa.toUpperCase()} guardada.`,
      });
      return true;
    } catch (err) {
      useToastStore.getState().pushToast({
        variant: 'error',
        title: 'Error al editar vehículo',
        description: err instanceof Error ? err.message : 'Error inesperado.',
      });
      return false;
    }
  },

  fetchHistorialVehiculo: async (id_vehiculo) => {
    return apiRequest<OrdenTrabajo[]>(`/vehiculos/${id_vehiculo}/historial`);
  },

  abrirOrden: async (payload) => {
    try {
      const created = await apiRequest<OrdenTrabajo>('/ordenes', { method: 'POST', body: payload });
      await Promise.all([get().fetchServiceAll(), useInventoryStore.getState().fetchDashboard()]);
      useToastStore.getState().pushToast({
        variant: 'success',
        title: `Orden de Trabajo OT-#${created.id_orden} abierta`,
        description: `Vehículo ${created.vehiculo_placa} asignado a ${created.mecanico_nombre}.`,
      });
      return created;
    } catch (err) {
      useToastStore.getState().pushToast({
        variant: 'error',
        title: 'No se pudo abrir la orden',
        description: err instanceof Error ? err.message : 'Error inesperado.',
      });
      return null;
    }
  },

  actualizarDiagnostico: async (id_orden, diagnostico, estado) => {
    try {
      await apiRequest(`/ordenes/${id_orden}/diagnostico`, {
        method: 'PATCH',
        body: { diagnostico, estado },
      });
      await get().fetchServiceAll();
      useToastStore.getState().pushToast({
        variant: 'success',
        title: `Diagnóstico actualizado (OT-#${id_orden})`,
        description: 'Los detalles técnicos se guardaron en SQLite.',
      });
      return true;
    } catch (err) {
      useToastStore.getState().pushToast({
        variant: 'error',
        title: 'No se pudo actualizar diagnóstico',
        description: err instanceof Error ? err.message : 'Error inesperado.',
      });
      return false;
    }
  },

  cerrarOrden: async (id_orden) => {
    try {
      await apiRequest(`/ordenes/${id_orden}/cerrar`, { method: 'POST' });
      await Promise.all([get().fetchServiceAll(), useInventoryStore.getState().fetchDashboard()]);
      useToastStore.getState().pushToast({
        variant: 'success',
        title: `Orden OT-#${id_orden} cerrada`,
        description: 'Se registró la fecha de cierre definitiva.',
      });
      return true;
    } catch (err) {
      useToastStore.getState().pushToast({
        variant: 'error',
        title: 'Error al cerrar orden',
        description: err instanceof Error ? err.message : 'Error inesperado.',
      });
      return false;
    }
  },

  asignarRepuestoAOrden: async (payload) => {
    try {
      const result = await apiRequest<AsignacionRepuestoResult>(
        `/ordenes/${payload.id_orden}/repuestos`,
        {
          method: 'POST',
          body: {
            id_producto: payload.id_producto,
            cantidad: payload.cantidad,
            motivo: payload.motivo,
          },
        }
      );

      await Promise.all([
        get().fetchServiceAll(),
        get().fetchRepuestosOrden(payload.id_orden),
        useInventoryStore.getState().fetchInventoryAll(),
      ]);

      useToastStore.getState().pushToast({
        variant: 'success',
        title: `Repuesto asignado a OT-#${payload.id_orden}`,
        description: `${result.producto.nombre} (x${payload.cantidad}) descontado del inventario. Salida #${result.movimiento.id_movimiento}.`,
      });

      if (result.alertaGenerada) {
        useToastStore.getState().pushToast({
          variant: 'warning',
          title: 'Alerta de Stock Mínimo activada',
          description: `"${result.producto.nombre}" quedó con ${result.producto.stock_actual} ${result.producto.unidad_medida}(s) (mínimo: ${result.producto.nivel_minimo}).`,
        });
      }

      return { ok: true, result };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Stock insuficiente o error al asignar repuesto.';
      useToastStore.getState().pushToast({
        variant: 'error',
        title: 'No se pudo asignar el repuesto',
        description: message,
      });
      return { ok: false, error: message };
    }
  },
}));
