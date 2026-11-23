import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { APP_CONFIG } from '../config/app.config';
import type { ThemeMode } from '../types/models';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

export function applyThemeToDom(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => {
        applyThemeToDom(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const next: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
        applyThemeToDom(next);
        set({ theme: next });
      },
    }),
    {
      name: APP_CONFIG.storageKeys.theme,
      onRehydrateStorage: () => (state) => {
        applyThemeToDom(state?.theme ?? 'dark');
      },
    }
  )
);
