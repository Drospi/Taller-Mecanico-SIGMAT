import type { ThemeMode } from '../types/models';

export interface ThemePalette {
  mode: ThemeMode;
  label: string;
  bgBase: string;
  bgSurface: string;
  bgElevated: string;
  bgMuted: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  accentSoft: string;
  statusSuccess: string;
  statusWarning: string;
  statusDanger: string;
  statusNeutral: string;
}

/**
 * Paleta industrial de precisión inspirada en AXIS WORKS:
 * - Modo Negro: Obsidiana (#0A0A0C), Acero cepillado (#141518 / #1C1E22), Naranja Señal (#F2491E) y Verde Calidad (#8CE043).
 * - Modo Claro: Titanio claro (#F4F4F2), Superficie blanca (#FFFFFF), Tinta carbón (#0F1115) y el mismo Naranja Señal (#E84319).
 */
export const THEME_PALETTES: Record<ThemeMode, ThemePalette> = {
  dark: {
    mode: 'dark',
    label: 'Modo Negro',
    bgBase: '#0A0A0C',
    bgSurface: '#121316',
    bgElevated: '#1A1C21',
    bgMuted: '#22252C',
    border: '#262930',
    borderStrong: '#383C46',
    textPrimary: '#F7F8FA',
    textSecondary: '#A4A9B4',
    textMuted: '#6E7380',
    accent: '#F2491E',
    accentHover: '#FF5B30',
    accentSoft: 'rgba(242, 73, 30, 0.14)',
    statusSuccess: '#8CE043',
    statusWarning: '#F59E0B',
    statusDanger: '#EF4444',
    statusNeutral: '#D0D4DC',
  },
  light: {
    mode: 'light',
    label: 'Modo Claro',
    bgBase: '#F3F3F1',
    bgSurface: '#FFFFFF',
    bgElevated: '#EAEBE8',
    bgMuted: '#E2E4E0',
    border: '#D8DBE0',
    borderStrong: '#BFC4CE',
    textPrimary: '#0E1014',
    textSecondary: '#4A505C',
    textMuted: '#6E7482',
    accent: '#E64217',
    accentHover: '#CC3710',
    accentSoft: 'rgba(230, 66, 23, 0.10)',
    statusSuccess: '#2E9E35',
    statusWarning: '#D97706',
    statusDanger: '#DC2626',
    statusNeutral: '#525866',
  },
};

export const ROLE_COLORS = {
  Administrador: {
    dot: '#3B82F6',
    badgeClass: 'badge-role-admin',
    code: '01 / ADMIN',
  },
  Mecánico: {
    dot: '#F2491E',
    badgeClass: 'badge-role-mechanic',
    code: '02 / SERVICIO',
  },
  'Encargado de Almacén': {
    dot: '#8CE043',
    badgeClass: 'badge-role-warehouse',
    code: '03 / ALMACÉN',
  },
} as const;
