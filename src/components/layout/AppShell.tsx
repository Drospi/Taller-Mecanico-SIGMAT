import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ToastContainer } from '../ui/ToastContainer';

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex bg-[var(--bg-base)] text-[var(--text-primary)]">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
        <footer className="border-t border-[var(--border-subtle)] px-6 py-4 bg-[var(--bg-surface)]/70">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--text-muted)] font-mono-tech">
            <span>SIGMAT // GESTIÓN DE INVENTARIO Y SERVICIO TÉCNICO</span>
            <span>SQLITE LOCAL · 10 TABLAS UML · ZUSTAND STATE ENGINE</span>
          </div>
        </footer>
      </div>
      <ToastContainer />
    </div>
  );
}
