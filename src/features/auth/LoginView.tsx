import { useState, type FormEvent } from 'react';
import { ArrowRight, Cog, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';
import { APP_CONFIG } from '../../config/app.config';
import { TEST_ACTOR_ACCOUNTS, type TestActorAccount } from '../../config/roles.config';
import { useAuthStore, useNavigationStore } from '../../store';
import {
  Badge,
  BaseButton,
  FormInput,
  PrimaryActionButton,
  ThemeToggleButton,
  ToastContainer,
} from '../../components/ui';

export function LoginView() {
  const [email, setEmail] = useState('admin@sigmat.com');
  const [password, setPassword] = useState('Admin123*');

  const iniciarSesion = useAuthStore((s) => s.iniciarSesion);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const setActiveSection = useNavigationStore((s) => s.setActiveSection);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await iniciarSesion(email, password);
    if (ok) {
      setActiveSection('dashboard');
    }
  };

  const handleQuickLogin = async (account: TestActorAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    clearError();
    const ok = await iniciarSesion(account.email, account.password);
    if (ok) {
      setActiveSection('dashboard');
    }
  };

  const handleFillOnly = (account: TestActorAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    clearError();
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col">
      {/* Barra superior minimalista estilo AXIS WORKS */}
      <header className="h-16 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-sm px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[4px] bg-[var(--accent)] text-white flex items-center justify-center">
            <Cog className="w-5 h-5" />
          </div>
          <span className="font-display font-bold tracking-[0.18em] text-sm">
            SIGMAT WORKS
          </span>
          <span className="hidden md:inline-block h-4 w-px bg-[var(--border-strong)] mx-1" />
          <span className="hidden md:inline font-mono-tech text-[11px] text-[var(--text-muted)] uppercase tracking-widest">
            INVENTARIO · SERVICIO TÉCNICO · SQLITE
          </span>
        </div>
        <ThemeToggleButton />
      </header>

      {/* Contenido dividido */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12">
        {/* Panel Izquierdo Hero Industrial */}
        <section className="lg:col-span-7 sigmat-hero-surface relative overflow-hidden border-b lg:border-b-0 lg:border-r border-[var(--border-subtle)] p-6 sm:p-10 lg:p-14 flex flex-col justify-between">
          {/* Engranaje decorativo geométrico estilo Axis Works */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-20 w-[440px] h-[440px] opacity-15"
          >
            <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
              <circle cx="100" cy="100" r="78" stroke="currentColor" strokeWidth="14" strokeDasharray="16 10" />
              <circle cx="100" cy="100" r="50" stroke="#F2491E" strokeWidth="6" />
              <circle cx="100" cy="100" r="24" stroke="currentColor" strokeWidth="10" />
              <line x1="100" y1="8" x2="100" y2="192" stroke="#F2491E" strokeWidth="2" opacity="0.5" />
              <line x1="8" y1="100" x2="192" y2="100" stroke="#F2491E" strokeWidth="2" opacity="0.5" />
            </svg>
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono-tech text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                INGENIERÍA AUTOMOTRIZ / EST. {APP_CONFIG.estYear}
              </span>
              <span className="h-px w-12 bg-[var(--border-strong)]" />
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-bold leading-[1.04] tracking-tight text-[var(--text-primary)]">
              Precisión mecánica para{' '}
              <span className="text-[var(--accent)]">cada orden y repuesto.</span>
            </h1>

            <p className="mt-5 text-base text-[var(--text-secondary)] max-w-xl leading-relaxed">
              Sistema integral <strong className="text-[var(--text-primary)]">SIGMAT</strong> para
              control de inventario, alertas automáticas de stock mínimo, órdenes de trabajo y
              trazabilidad completa respaldada en base de datos SQLite y estados con Zustand.
            </p>

            {/* Métricas de precisión al estilo AXIS WORKS */}
            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-[var(--border-subtle)] pt-6 max-w-xl">
              {APP_CONFIG.workshopSpecs.map((spec, idx) => (
                <div
                  key={spec.label}
                  className={idx > 0 ? 'border-l border-[var(--border-subtle)] pl-4' : ''}
                >
                  <div className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                    {spec.value}
                  </div>
                  <div className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--text-muted)] mt-1">
                    {spec.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tarjetas de Actores de Prueba (3 roles del Diagrama de Casos de Uso) */}
          <div className="relative z-10 mt-10">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                USUARIOS DE PRUEBA POR ACTOR (ACCESO RÁPIDO)
              </span>
              <Badge tone="accent" dot>
                3 ROLES UML
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {TEST_ACTOR_ACCOUNTS.map((acc) => (
                <div
                  key={acc.email}
                  className="sigmat-card rounded-[4px] p-4 flex flex-col justify-between gap-3 hover:border-[var(--accent-border)]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: acc.dotColor }}
                        />
                        <span className="font-mono-tech text-[11px] text-[var(--text-muted)]">
                          {acc.index}
                        </span>
                      </div>
                      <span className="font-mono-tech text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-[var(--border-subtle)] text-[var(--text-muted)]">
                        {acc.tag}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                      {acc.rol}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {acc.nombreCompleto}
                    </p>

                    <div className="mt-2.5 p-2 rounded-[3px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] font-mono-tech text-[11px] space-y-0.5">
                      <div className="truncate text-[var(--text-primary)]">{acc.email}</div>
                      <div className="text-[var(--text-muted)]">Clave: {acc.password}</div>
                    </div>

                    <p className="text-[11px] text-[var(--text-muted)] mt-2 leading-relaxed">
                      {acc.summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-[var(--border-subtle)]">
                    <BaseButton
                      variant="secondary"
                      size="xs"
                      onClick={() => handleFillOnly(acc)}
                      className="flex-1"
                    >
                      Rellenar
                    </BaseButton>
                    <BaseButton
                      variant="primary"
                      size="xs"
                      loading={loading}
                      rightIcon={<ArrowRight className="w-3 h-3" />}
                      onClick={() => void handleQuickLogin(acc)}
                      className="flex-1"
                    >
                      Entrar
                    </BaseButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Panel Derecho: Formulario Iniciar Sesión */}
        <section className="lg:col-span-5 p-6 sm:p-10 lg:p-14 flex items-center justify-center bg-[var(--bg-base)]">
          <div className="w-full max-w-md sigmat-card rounded-[4px] p-7 sm:p-8">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
              <span className="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[var(--accent)]">
                CU: INICIAR SESIÓN
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
              Acceso al Taller SIGMAT
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
              Ingresa tus credenciales registradas en la tabla <code className="font-mono-tech text-[var(--text-primary)]">usuarios</code> o selecciona un actor de prueba.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="relative">
                <FormInput
                  label="Correo electrónico"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) clearError();
                  }}
                  placeholder="usuario@sigmat.com"
                />
                <Mail className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-[33px] pointer-events-none" />
              </div>

              <div className="relative">
                <FormInput
                  label="Contraseña"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) clearError();
                  }}
                  placeholder="••••••••"
                />
                <Lock className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-[33px] pointer-events-none" />
              </div>

              {error && (
                <div className="p-3 rounded-[4px] border border-[var(--status-danger)]/40 bg-[var(--status-danger-soft)] text-xs text-[var(--status-danger)]">
                  {error}
                </div>
              )}

              <PrimaryActionButton
                type="submit"
                label="Iniciar Sesión en SIGMAT"
                loading={loading}
                fullWidth
                size="lg"
              />
            </form>

            <div className="mt-6 pt-5 border-t border-[var(--border-subtle)] flex items-start gap-2.5 text-xs text-[var(--text-muted)]">
              <KeyRound className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
              <span>
                Las contraseñas se verifican contra hashes <code className="font-mono-tech">scrypt</code> almacenados en{' '}
                <code className="font-mono-tech">db/sigmat.sqlite</code>.
              </span>
            </div>
          </div>
        </section>
      </div>
      <ToastContainer />
    </div>
  );
}
