export const APP_CONFIG = {
  code: 'SIGMAT',
  name: 'SIGMAT Taller Mecánico',
  subtitle: 'Sistema de Gestión de Inventario y Servicio Técnico',
  version: '2.0.0',
  estYear: '2026',
  apiBaseUrl: '/api',
  locale: 'es-BO',
  currency: {
    code: 'USD',
    symbol: '$',
    decimals: 2,
  },
  storageKeys: {
    theme: 'sigmat-theme-storage',
    auth: 'sigmat-auth-storage',
    nav: 'sigmat-nav-storage',
  },
  workshopSpecs: [
    { value: '10 Tablas', label: 'ESQUEMA SQLITE RELACIONAL' },
    { value: '3 Actores', label: 'CONTROL BASADO EN ROLES' },
    { value: '24/7', label: 'TRAZABILIDAD DE INVENTARIO' },
  ],
} as const;
