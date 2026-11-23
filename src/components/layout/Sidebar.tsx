import {
  AlertTriangle,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Cog,
  Database,
  FileBarChart2,
  FolderTree,
  History,
  LayoutDashboard,
  Package,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { APP_CONFIG } from '../../config/app.config';
import { NAV_ITEMS, type NavSectionId } from '../../config/roles.config';
import { ROLE_COLORS } from '../../config/theme.config';
import { useAuthStore, useInventoryStore, useNavigationStore } from '../../store';
import type { NombreRol } from '../../types/models';
import { cn } from '../../utils/cn';
import { LogoutButton } from '../ui/buttons';

const SECTION_ICONS: Record<NavSectionId, ReactNode> = {
  dashboard: <LayoutDashboard className="w-4 h-4 shrink-0" />,
  ordenes: <ClipboardList className="w-4 h-4 shrink-0" />,
  'asignar-repuesto': <Wrench className="w-4 h-4 shrink-0" />,
  historial: <History className="w-4 h-4 shrink-0" />,
  productos: <Package className="w-4 h-4 shrink-0" />,
  movimientos: <ArrowLeftRight className="w-4 h-4 shrink-0" />,
  alertas: <AlertTriangle className="w-4 h-4 shrink-0" />,
  categorias: <FolderTree className="w-4 h-4 shrink-0" />,
  usuarios: <Users className="w-4 h-4 shrink-0" />,
  reportes: <FileBarChart2 className="w-4 h-4 shrink-0" />,
  arquitectura: <Database className="w-4 h-4 shrink-0" />,
};

export function Sidebar() {
  const usuario = useAuthStore((s) => s.usuario);
  const cerrarSesion = useAuthStore((s) => s.cerrarSesion);
  const activeSection = useNavigationStore((s) => s.activeSection);
  const setActiveSection = useNavigationStore((s) => s.setActiveSection);
  const collapsed = useNavigationStore((s) => s.sidebarCollapsed);
  const toggleCollapsed = useNavigationStore((s) => s.toggleSidebarCollapsed);
  const mobileOpen = useNavigationStore((s) => s.mobileSidebarOpen);
  const setMobileOpen = useNavigationStore((s) => s.setMobileSidebarOpen);
  const alertas = useInventoryStore((s) => s.alertas);

  const pendingAlerts = alertas.filter((a) => a.estado === 'PENDIENTE').length;
  const userRole = usuario?.nombre_rol as NombreRol | undefined;

  const visibleItems = NAV_ITEMS.filter(
    (item) => !userRole || item.allowedRoles.includes(userRole)
  );

  const groups = ['GENERAL', 'SERVICIO TÉCNICO', 'INVENTARIO', 'ADMINISTRACIÓN', 'SISTEMA'] as const;
  const roleMeta = userRole ? ROLE_COLORS[userRole] : null;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] border-r border-[var(--border-subtle)]">
      {/* Marca industrial SIGMAT */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[var(--border-subtle)] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-[4px] bg-[var(--accent)] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Cog className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-display font-bold text-sm tracking-[0.14em] text-[var(--text-primary)] leading-none">
                {APP_CONFIG.code}
              </div>
              <div className="font-mono-tech text-[10px] uppercase tracking-widest text-[var(--text-muted)] mt-1 truncate">
                TALLER MECÁNICO
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleCollapsed}
          className="hidden lg:flex p-1.5 rounded-[4px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
          title={collapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-[4px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          aria-label="Cerrar menú lateral"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Actor activo */}
      {!collapsed && usuario && (
        <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: roleMeta?.dot ?? 'var(--accent)' }}
            />
            <span className="font-mono-tech text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
              {roleMeta?.code ?? 'ACTOR'}
            </span>
          </div>
          <div className="text-sm font-semibold text-[var(--text-primary)] mt-1 truncate">
            {usuario.nombre} {usuario.apellido}
          </div>
          <div className="text-xs text-[var(--text-secondary)] truncate">{usuario.nombre_rol}</div>
        </div>
      )}

      {/* Menú agrupado por módulos UML */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4">
        {groups.map((group) => {
          const items = visibleItems.filter((i) => i.moduleGroup === group);
          if (items.length === 0) return null;
          return (
            <div key={group}>
              {!collapsed && (
                <div className="px-2.5 mb-1.5 font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  {group}
                </div>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSection(item.id)}
                      title={collapsed ? `${item.label} — ${item.useCaseRef}` : item.useCaseRef}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[4px] text-left transition-all cursor-pointer border',
                        isActive
                          ? 'bg-[var(--accent-soft)] text-[var(--text-primary)] border-[var(--accent-border)]'
                          : 'bg-transparent text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                      )}
                    >
                      <span className={cn(isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]')}>
                        {SECTION_ICONS[item.id]}
                      </span>
                      {!collapsed && (
                        <>
                          <span className="text-xs font-medium flex-1 truncate">{item.label}</span>
                          {item.id === 'alertas' && pendingAlerts > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full font-mono-tech text-[10px] font-bold bg-[var(--accent)] text-white">
                              {pendingAlerts}
                            </span>
                          )}
                          {item.id !== 'alertas' && (
                            <span className="font-mono-tech text-[10px] text-[var(--text-muted)]">
                              {item.index}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Pie con Cerrar Sesión */}
      <div className="p-3 border-t border-[var(--border-subtle)] shrink-0">
        <LogoutButton
          compact={collapsed}
          fullWidth={!collapsed}
          onClick={() => {
            void cerrarSesion();
          }}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:block shrink-0 transition-all duration-200 h-screen sticky top-0',
          collapsed ? 'w-[70px]' : 'w-[264px]'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-black/70 flex"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMobileOpen(false);
          }}
        >
          <div className="w-[272px] max-w-[85vw] h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
