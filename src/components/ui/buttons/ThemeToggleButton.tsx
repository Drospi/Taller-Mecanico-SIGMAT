import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../../store';
import { BaseButton, type BaseButtonProps } from './BaseButton';

export interface ThemeToggleButtonProps extends Omit<BaseButtonProps, 'onClick' | 'variant'> {
  compact?: boolean;
}

/**
 * Botón reutilizable conectado a Zustand (useThemeStore) para alternar Modo Claro / Modo Negro.
 */
export function ThemeToggleButton({ compact = false, size = 'sm', ...props }: ThemeToggleButtonProps) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const isDark = theme === 'dark';

  return (
    <BaseButton
      variant="secondary"
      size={size}
      onClick={toggleTheme}
      title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Negro'}
      aria-label={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Negro'}
      leftIcon={
        isDark ? (
          <Sun className="w-4 h-4 text-[var(--accent)] shrink-0" />
        ) : (
          <Moon className="w-4 h-4 text-[var(--accent)] shrink-0" />
        )
      }
      {...props}
    >
      {!compact && (
        <span className="font-mono-tech text-[11px] uppercase tracking-wider">
          {isDark ? 'Modo Claro' : 'Modo Negro'}
        </span>
      )}
    </BaseButton>
  );
}
