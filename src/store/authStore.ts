import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { APP_CONFIG } from '../config/app.config';
import type { Usuario } from '../types/models';
import { apiRequest, registerAuthUserIdProvider } from '../utils/apiClient';
import { useToastStore } from './toastStore';

interface AuthState {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  iniciarSesion: (email: string, password: string) => Promise<boolean>;
  cerrarSesion: () => Promise<void>;
  cambiarPassword: (nuevaPassword: string) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      usuario: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      iniciarSesion: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const data = await apiRequest<{ usuario: Usuario }>('/auth/login', {
            method: 'POST',
            body: { email, password },
          });
          set({
            usuario: data.usuario,
            isAuthenticated: true,
            loading: false,
            error: null,
          });
          useToastStore.getState().pushToast({
            variant: 'success',
            title: `Bienvenido, ${data.usuario.nombre} ${data.usuario.apellido}`,
            description: `Sesión iniciada como ${data.usuario.nombre_rol}.`,
          });
          return true;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error al iniciar sesión.';
          set({ loading: false, error: message });
          useToastStore.getState().pushToast({
            variant: 'error',
            title: 'Acceso denegado',
            description: message,
          });
          return false;
        }
      },

      cerrarSesion: async () => {
        try {
          await apiRequest('/auth/logout', { method: 'POST' });
        } catch {
          // Session cleared locally even if network hiccups
        }
        set({ usuario: null, isAuthenticated: false, error: null });
        useToastStore.getState().pushToast({
          variant: 'info',
          title: 'Sesión cerrada',
          description: 'Has salido del sistema SIGMAT de forma segura.',
        });
      },

      cambiarPassword: async (nuevaPassword) => {
        const user = get().usuario;
        if (!user) return false;
        set({ loading: true });
        try {
          await apiRequest('/auth/change-password', {
            method: 'POST',
            body: { id_usuario: user.id_usuario, nuevaPassword },
          });
          set({ loading: false });
          useToastStore.getState().pushToast({
            variant: 'success',
            title: 'Contraseña actualizada',
            description: 'Tu contraseña se guardó en SQLite correctamente.',
          });
          return true;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.';
          set({ loading: false });
          useToastStore.getState().pushToast({
            variant: 'error',
            title: 'Error de seguridad',
            description: message,
          });
          return false;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: APP_CONFIG.storageKeys.auth,
      partialize: (state) => ({
        usuario: state.usuario,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

registerAuthUserIdProvider(() => useAuthStore.getState().usuario?.id_usuario ?? null);
