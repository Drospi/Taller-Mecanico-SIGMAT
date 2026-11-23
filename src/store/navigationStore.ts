import { create } from 'zustand';
import { NAV_ITEMS, type NavSectionId } from '../config/roles.config';
import type { NombreRol } from '../types/models';

interface NavigationState {
  activeSection: NavSectionId;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  selectedOrderIdForAssign: number | null;
  setActiveSection: (section: NavSectionId) => void;
  toggleSidebarCollapsed: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  goToAssignPartsForOrder: (id_orden: number) => void;
  clearSelectedOrderForAssign: () => void;
  ensureAllowedForRole: (role?: string) => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  activeSection: 'dashboard',
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  selectedOrderIdForAssign: null,

  setActiveSection: (section) =>
    set({ activeSection: section, mobileSidebarOpen: false }),

  toggleSidebarCollapsed: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),

  goToAssignPartsForOrder: (id_orden) =>
    set({
      selectedOrderIdForAssign: id_orden,
      activeSection: 'asignar-repuesto',
      mobileSidebarOpen: false,
    }),

  clearSelectedOrderForAssign: () => set({ selectedOrderIdForAssign: null }),

  ensureAllowedForRole: (role) => {
    if (!role) return;
    const current = get().activeSection;
    const item = NAV_ITEMS.find((n) => n.id === current);
    if (!item || !item.allowedRoles.includes(role as NombreRol)) {
      set({ activeSection: 'dashboard' });
    }
  },
}));
