import { useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { LoginView } from './features/auth/LoginView';
import { DashboardView } from './features/dashboard/DashboardView';
import { ProductosView } from './features/inventario/ProductosView';
import { MovimientosView } from './features/inventario/MovimientosView';
import { CategoriasView } from './features/inventario/CategoriasView';
import { AlertasStockView } from './features/inventario/AlertasStockView';
import { OrdenesTrabajoView } from './features/servicio/OrdenesTrabajoView';
import { AsignarRepuestoView } from './features/servicio/AsignarRepuestoView';
import { HistorialOrdenesView } from './features/servicio/HistorialOrdenesView';
import { UsuariosView } from './features/admin/UsuariosView';
import { ReportesView } from './features/admin/ReportesView';
import { ArquitecturaView } from './features/sistema/ArquitecturaView';
import {
  applyThemeToDom,
  useAdminStore,
  useAuthStore,
  useInventoryStore,
  useNavigationStore,
  useServiceStore,
  useThemeStore,
} from './store';

export function App() {
  const theme = useThemeStore((s) => s.theme);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const usuario = useAuthStore((s) => s.usuario);

  const activeSection = useNavigationStore((s) => s.activeSection);
  const ensureAllowedForRole = useNavigationStore((s) => s.ensureAllowedForRole);

  const fetchInventoryAll = useInventoryStore((s) => s.fetchInventoryAll);
  const fetchServiceAll = useServiceStore((s) => s.fetchServiceAll);
  const fetchAdminAll = useAdminStore((s) => s.fetchAdminAll);

  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated || !usuario) return;
    ensureAllowedForRole(usuario.nombre_rol);
    void Promise.all([fetchInventoryAll(), fetchServiceAll(), fetchAdminAll()]);
  }, [
    isAuthenticated,
    usuario,
    ensureAllowedForRole,
    fetchInventoryAll,
    fetchServiceAll,
    fetchAdminAll,
  ]);

  if (!isAuthenticated || !usuario) {
    return <LoginView />;
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'ordenes':
        return <OrdenesTrabajoView />;
      case 'asignar-repuesto':
        return <AsignarRepuestoView />;
      case 'historial':
        return <HistorialOrdenesView />;
      case 'productos':
        return <ProductosView />;
      case 'movimientos':
        return <MovimientosView />;
      case 'categorias':
        return <CategoriasView />;
      case 'alertas':
        return <AlertasStockView />;
      case 'usuarios':
        return <UsuariosView />;
      case 'reportes':
        return <ReportesView />;
      case 'arquitectura':
        return <ArquitecturaView />;
      case 'dashboard':
      default:
        return <DashboardView />;
    }
  };

  return <AppShell>{renderSection()}</AppShell>;
}

export default App;
