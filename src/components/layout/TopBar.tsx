import { Bell, Menu } from 'lucide-react';
import { NAV_ITEMS } from '../../config/roles.config';
import { useAuthStore, useInventoryStore, useNavigationStore } from '../../store';
import type { NombreRol } from '../../types/models';
import { Badge } from '../ui/Badge';
import { ThemeToggleButton } from '../ui/buttons';

export function TopBar() {
  const usuario = useAuthStore((s) => s.usuario);
  const activeSection = useNavigationStore((s) => s.activeSection);
  const setActiveSection = useNavigationStore((s) => s.setActiveSection);
  const setMobileOpen = useNavigationStore((s) => s.setMobileSidebarOpen);
  const alertas = useInventoryStore((s) => s.alertas);

  const pendingCount = alertas.filter((a) => a.estado === 'PENDIENTE').length;
  const activeNav = NAV_ITEMS.find((n) => n.id === activeSection);
  const canViewAlerts =
    usuario?.nombre_rol === 'Administrador' || usuario?.nombre_rol === 'Encargado de Almacén';

  const roleToneMap: Record<NombreRol, 'info' | 'accent' | 'ok'> = {
    Administrador: 'info',
    Mecánico: 'accent',
    'Encargado de Almacén': 'ok',
  };
  const roleTone =
    usuario?.nombre_rol && usuario.nombre_rol in roleToneMap
      ? roleToneMap[usuario.nombre_rol as NombreRol]
      : 'neutral';

  return (
    <header className="h-16 sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-sm px-4 sm:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú de navegación"
          className="lg:hidden p-2 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono-tech text-[11px] text-[var(--accent)] font-semibold">
              {activeNav?.index ?? '00'}
            </span>
            <span className="text-[var(--border-strong)]">/</span>
            <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {activeNav?.label ?? 'Panel Principal'}
            </span>
          </div>
          <div className="hidden md:block font-mono-tech text-[10px] uppercase tracking-wider text-[var(--text-muted)] truncate">
            {activeNav?.useCaseRef ?? 'SIGMAT — SQLite + Zustand'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {canViewAlerts && (
          <button
            type="button"
            onClick={() => setActiveSection('alertas')}
            title="Ver alertas de stock mínimo"
            className="relative inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="hidden sm:inline font-mono-tech text-[11px]">ALERTAS</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[var(--accent)] text-white font-mono-tech text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        )}

        <ThemeToggleButton />

        {usuario && (
          <div className="hidden sm:flex items-center pl-2 border-l border-[var(--border-subtle)]">
            <Badge tone={roleTone} dot>
              {usuario.nombre_rol}
            </Badge>
          </div>
        )}
      </div>
    </header>
  );
}
