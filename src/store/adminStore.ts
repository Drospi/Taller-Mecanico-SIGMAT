import { create } from 'zustand';
import type { Reporte, ReporteGeneradoResponse, Rol, TipoReporte, Usuario } from '../types/models';
import { apiRequest } from '../utils/apiClient';
import { useInventoryStore } from './inventoryStore';
import { useToastStore } from './toastStore';

interface AdminState {
  roles: Rol[];
  usuarios: Usuario[];
  reportes: Reporte[];
  reporteActivo: ReporteGeneradoResponse | null;
  loading: boolean;

  fetchAdminAll: () => Promise<void>;
  createUsuario: (payload: {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    id_rol: number;
    estado: boolean;
  }) => Promise<boolean>;
  updateUsuario: (
    id_usuario: number,
    payload: {
      nombre: string;
      apellido: string;
      email: string;
      id_rol: number;
      estado: boolean;
    }
  ) => Promise<boolean>;
  toggleEstadoUsuario: (id_usuario: number, estado: boolean) => Promise<boolean>;
  resetPasswordUsuario: (id_usuario: number, password: string) => Promise<boolean>;

  generarReporte: (
    tipo_reporte: TipoReporte,
    parametros?: Record<string, unknown>
  ) => Promise<ReporteGeneradoResponse | null>;
  cargarReporteHistorico: (id_reporte: number) => Promise<ReporteGeneradoResponse | null>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  roles: [],
  usuarios: [],
  reportes: [],
  reporteActivo: null,
  loading: false,

  fetchAdminAll: async () => {
    set({ loading: true });
    try {
      const [roles, usuarios, reportes] = await Promise.all([
        apiRequest<Rol[]>('/roles'),
        apiRequest<Usuario[]>('/usuarios'),
        apiRequest<Reporte[]>('/reportes'),
      ]);
      set({ roles, usuarios, reportes, loading: false });
    } catch (err) {
      set({ loading: false });
      useToastStore.getState().pushToast({
        variant: 'error',
        title: 'Error cargando administración',
        description: err instanceof Error ? err.message : 'Fallo consultando usuarios y reportes.',
      });
    }
  },

  createUsuario: async (payload) => {
    try {
      await apiRequest<Usuario>('/usuarios', { method: 'POST', body: payload });
      await Promise.all([get().fetchAdminAll(), useInventoryStore.getState().fetchDashboard()]);
      useToastStore.getState().pushToast({
        variant: 'success',
        title: 'Usuario registrado',
        description: `${payload.nombre} ${payload.apellido} (${payload.email}) creado en SQLite.`,
      });
      return true;
    } catch (err) {
      useToastStore.getState().pushToast({
        variant: 'error',
        title: 'Error al crear usuario',
        description: err instanceof Error ? err.message : 'Verifique los datos.',
      });
      return false;
    }
  },

  updateUsuario: async (id_usuario, payload) => {
    try {
      await apiRequest<Usuario>(`/usuarios/${id_usuario}`, { method: 'PUT', body: payload });
      await Promise.all([get().fetchAdminAll(), useInventoryStore.getState().fetchDashboard()]);
      useToastStore.getState().pushToast({
        variant: 'success',
        title: 'Usuario actualizado',
        description: `Se guardaron los datos de ${payload.nombre} ${payload.apellido}.`,
      });
      return true;
    } catch (err) {
      useToastStore.getState().pushToast({
        variant: 'error',
        title: 'No se pudo actualizar usuario',
        description: err instanceof Error ? err.message : 'Error inesperado.',
      });
      return false;
    }
  },

  toggleEstadoUsuario: async (id_usuario, estado) => {
    try {
      await apiRequest(`/usuarios/${id_usuario}/estado`, { method: 'PATCH', body: { estado } });
      await Promise.all([get().fetchAdminAll(), useInventoryStore.getState().fetchDashboard()]);
      useToastStore.getState().pushToast({
        variant: 'info',
        title: estado ? 'Usuario activado' : 'Usuario desactivado',
        description: `El estado de la cuenta #${id_usuario} se actualizó en SQLite.`,
      });
      return true;
    } catch (err) {
      useToastStore.getState().pushToast({
        variant: 'error',
        title: 'No se pudo cambiar estado',
        description: err instanceof Error ? err.message : 'Error inesperado.',
      });
      return false;
    }
  },

  resetPasswordUsuario: async (id_usuario, password) => {
    try {
      await apiRequest(`/usuarios/${id_usuario}/password`, { method: 'PATCH', body: { password } });
      useToastStore.getState().pushToast({
        variant: 'success',
        title: 'Contraseña restablecida',
        description: `Se actualizó el hash de seguridad para el usuario #${id_usuario}.`,
      });
      return true;
    } catch (err) {
      useToastStore.getState().pushToast({
        variant: 'error',
        title: 'Error cambiando contraseña',
        description: err instanceof Error ? err.message : 'Error inesperado.',
      });
      return false;
    }
  },

  generarReporte: async (tipo_reporte, parametros = {}) => {
    set({ loading: true });
    try {
      const payload = await apiRequest<ReporteGeneradoResponse>('/reportes/generar', {
        method: 'POST',
        body: { tipo_reporte, parametros },
      });
      const reportes = await apiRequest<Reporte[]>('/reportes');
      await useInventoryStore.getState().fetchDashboard();
      set({ reporteActivo: payload, reportes, loading: false });
      useToastStore.getState().pushToast({
        variant: 'success',
        title: `Reporte #${payload.reporte.id_reporte} generado`,
        description: `${payload.titulo} — ${payload.filas.length} registro(s) listos para PDF/Excel.`,
      });
      return payload;
    } catch (err) {
      set({ loading: false });
      useToastStore.getState().pushToast({
        variant: 'error',
        title: 'Error generando reporte',
        description: err instanceof Error ? err.message : 'Fallo en la generación.',
      });
      return null;
    }
  },

  cargarReporteHistorico: async (id_reporte) => {
    set({ loading: true });
    try {
      const payload = await apiRequest<ReporteGeneradoResponse>(`/reportes/${id_reporte}/datos`);
      set({ reporteActivo: payload, loading: false });
      return payload;
    } catch (err) {
      set({ loading: false });
      useToastStore.getState().pushToast({
        variant: 'error',
        title: 'Error cargando reporte',
        description: err instanceof Error ? err.message : 'Reporte no encontrado.',
      });
      return null;
    }
  },
}));
