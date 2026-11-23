import { APP_CONFIG } from '../config/app.config';

export function formatCurrency(amount: number | string | undefined | null): string {
  const num = Number(amount ?? 0);
  if (!Number.isFinite(num)) return `${APP_CONFIG.currency.symbol}0.00`;
  return `${APP_CONFIG.currency.symbol}${num.toLocaleString('en-US', {
    minimumFractionDigits: APP_CONFIG.currency.decimals,
    maximumFractionDigits: APP_CONFIG.currency.decimals,
  })}`;
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat(APP_CONFIG.locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatShortDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat(APP_CONFIG.locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export type StockHealth = 'agotado' | 'critico' | 'preventivo' | 'optimo';

export function getStockHealth(stockActual: number, nivelMinimo: number): StockHealth {
  if (stockActual <= 0) return 'agotado';
  if (stockActual <= nivelMinimo) return 'critico';
  if (stockActual <= Math.ceil(nivelMinimo * 1.35)) return 'preventivo';
  return 'optimo';
}

export function getStockPercentage(stockActual: number, nivelMinimo: number): number {
  const target = Math.max(nivelMinimo * 2.5, 10);
  return Math.min(100, Math.max(0, Math.round((stockActual / target) * 100)));
}
