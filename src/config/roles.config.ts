import type { NombreRol } from '../types/models';

export type NavSectionId =
  | 'dashboard'
  | 'ordenes'
  | 'asignar-repuesto'
  | 'historial'
  | 'productos'
  | 'movimientos'
  | 'categorias'
  | 'alertas'
  | 'usuarios'
  | 'reportes'
  | 'arquitectura';

export interface NavItemConfig {
  id: NavSectionId;
  index: string;
  label: string;
  shortLabel: string;
  moduleGroup: 'GENERAL' | 'SERVICIO TÉCNICO' | 'INVENTARIO' | 'ADMINISTRACIÓN' | 'SISTEMA';
  useCaseRef: string;
  allowedRoles: NombreRol[];
}

export const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'dashboard',
    index: '00',
    label: 'Panel Principal',
    shortLabel: 'Dashboard',
    moduleGroup: 'GENERAL',
    useCaseRef: 'Resumen Operativo',
    allowedRoles: ['Administrador', 'Mecánico', 'Encargado de Almacén'],
  },
  {
    id: 'ordenes',
    index: '01',
    label: 'Órdenes de Trabajo',
    shortLabel: 'Órdenes',
    moduleGroup: 'SERVICIO TÉCNICO',
    useCaseRef: 'CU: Registrar / Cerrar Orden de Trabajo',
    allowedRoles: ['Mecánico', 'Administrador'],
  },
  {
    id: 'asignar-repuesto',
    index: '02',
    label: 'Asignar Repuesto',
    shortLabel: 'Asignar',
    moduleGroup: 'SERVICIO TÉCNICO',
    useCaseRef: 'CU: Asignar Repuesto a Orden («extend» Salida)',
    allowedRoles: ['Mecánico'],
  },
  {
    id: 'historial',
    index: '03',
    label: 'Historial y Vehículos',
    shortLabel: 'Historial',
    moduleGroup: 'SERVICIO TÉCNICO',
    useCaseRef: 'CU: Consultar Historial de Órdenes',
    allowedRoles: ['Mecánico', 'Administrador'],
  },
  {
    id: 'productos',
    index: '04',
    label: 'Catálogo y Stock',
    shortLabel: 'Stock',
    moduleGroup: 'INVENTARIO',
    useCaseRef: 'CU: Consultar / Registrar / Editar Producto',
    allowedRoles: ['Encargado de Almacén', 'Mecánico', 'Administrador'],
  },
  {
    id: 'movimientos',
    index: '05',
    label: 'Entradas y Salidas',
    shortLabel: 'Movimientos',
    moduleGroup: 'INVENTARIO',
    useCaseRef: 'CU: Registrar Entrada / Salida de Inventario',
    allowedRoles: ['Encargado de Almacén', 'Administrador'],
  },
  {
    id: 'alertas',
    index: '06',
    label: 'Alertas Stock Mínimo',
    shortLabel: 'Alertas',
    moduleGroup: 'INVENTARIO',
    useCaseRef: 'CU: Generar Alerta de Stock Mínimo («include»)',
    allowedRoles: ['Encargado de Almacén', 'Administrador'],
  },
  {
    id: 'categorias',
    index: '07',
    label: 'Categorías',
    shortLabel: 'Categorías',
    moduleGroup: 'ADMINISTRACIÓN',
    useCaseRef: 'CU: Gestionar Categorías',
    allowedRoles: ['Administrador', 'Encargado de Almacén'],
  },
  {
    id: 'usuarios',
    index: '08',
    label: 'Usuarios y Roles',
    shortLabel: 'Usuarios',
    moduleGroup: 'ADMINISTRACIÓN',
    useCaseRef: 'CU: Gestionar Usuarios',
    allowedRoles: ['Administrador'],
  },
  {
    id: 'reportes',
    index: '09',
    label: 'Reportes PDF / Excel',
    shortLabel: 'Reportes',
    moduleGroup: 'ADMINISTRACIÓN',
    useCaseRef: 'CU: Generar Reportes',
    allowedRoles: ['Administrador', 'Encargado de Almacén'],
  },
  {
    id: 'arquitectura',
    index: '10',
    label: 'BD SQLite & Diagramas',
    shortLabel: 'SQLite / UML',
    moduleGroup: 'SISTEMA',
    useCaseRef: 'Esquema de Clases, Casos de Uso y Robustez',
    allowedRoles: ['Administrador', 'Mecánico', 'Encargado de Almacén'],
  },
];

export interface PermissionMatrix {
  canManageUsers: boolean;
  canManageCategories: boolean;
  canManageProducts: boolean;
  canRegisterMovements: boolean;
  canResolveAlerts: boolean;
  canCreateOrders: boolean;
  canCloseOrders: boolean;
  canAssignParts: boolean;
  canGenerateReports: boolean;
  canExportReports: boolean;
}

export const ROLE_PERMISSIONS: Record<NombreRol, PermissionMatrix> = {
  Administrador: {
    canManageUsers: true,
    canManageCategories: true,
    canManageProducts: false,
    canRegisterMovements: false,
    canResolveAlerts: true,
    canCreateOrders: false,
    canCloseOrders: false,
    canAssignParts: false,
    canGenerateReports: true,
    canExportReports: true,
  },
  Mecánico: {
    canManageUsers: false,
    canManageCategories: false,
    canManageProducts: false,
    canRegisterMovements: false,
    canResolveAlerts: false,
    canCreateOrders: true,
    canCloseOrders: true,
    canAssignParts: true,
    canGenerateReports: false,
    canExportReports: false,
  },
  'Encargado de Almacén': {
    canManageUsers: false,
    canManageCategories: true,
    canManageProducts: true,
    canRegisterMovements: true,
    canResolveAlerts: true,
    canCreateOrders: false,
    canCloseOrders: false,
    canAssignParts: false,
    canGenerateReports: true,
    canExportReports: true,
  },
};

export interface TestActorAccount {
  index: string;
  rol: NombreRol;
  nombreCompleto: string;
  email: string;
  password: string;
  dotColor: string;
  tag: string;
  summary: string;
  casosDeUso: string[];
}

export const TEST_ACTOR_ACCOUNTS: TestActorAccount[] = [
  {
    index: '01',
    rol: 'Administrador',
    nombreCompleto: 'Carlos Mendoza',
    email: 'admin@sigmat.com',
    password: 'Admin123*',
    dotColor: '#3B82F6',
    tag: 'CONTROL TOTAL / GESTIÓN',
    summary: 'Gestiona usuarios, roles, categorías del catálogo y reportes ejecutivos PDF/Excel.',
    casosDeUso: ['Gestionar Usuarios', 'Gestionar Categorías', 'Generar Reportes'],
  },
  {
    index: '02',
    rol: 'Mecánico',
    nombreCompleto: 'Diego Rojas',
    email: 'mecanico@sigmat.com',
    password: 'Mecanico123*',
    dotColor: '#F2491E',
    tag: 'SERVICIO TÉCNICO',
    summary: 'Registra órdenes de trabajo, diagnostica vehículos, asigna repuestos con salida automática y consulta stock.',
    casosDeUso: ['Registrar/Cerrar Orden', 'Asignar Repuesto', 'Consultar Historial y Stock'],
  },
  {
    index: '03',
    rol: 'Encargado de Almacén',
    nombreCompleto: 'Valeria Quiroga',
    email: 'almacen@sigmat.com',
    password: 'Almacen123*',
    dotColor: '#8CE043',
    tag: 'INVENTARIO / ALMACÉN',
    summary: 'Administra catálogo de productos, registra entradas y salidas, resuelve alertas de stock mínimo y reportes.',
    casosDeUso: ['CRUD Productos', 'Entradas y Salidas', 'Alertas Stock Mínimo'],
  },
];

export function getPermissionsForRole(rol?: string): PermissionMatrix {
  if (rol === 'Administrador' || rol === 'Mecánico' || rol === 'Encargado de Almacén') {
    return ROLE_PERMISSIONS[rol];
  }
  return {
    canManageUsers: false,
    canManageCategories: false,
    canManageProducts: false,
    canRegisterMovements: false,
    canResolveAlerts: false,
    canCreateOrders: false,
    canCloseOrders: false,
    canAssignParts: false,
    canGenerateReports: false,
    canExportReports: false,
  };
}
