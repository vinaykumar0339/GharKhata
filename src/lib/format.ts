import type { CurrencyCode } from '@/types/domain';

export const CURRENCIES: Record<CurrencyCode, { name: string; locale: string; symbol: string; flag: string }> = {
  INR: { name: 'Indian Rupee', locale: 'en-IN', symbol: '₹', flag: '🇮🇳' },
  USD: { name: 'US Dollar', locale: 'en-US', symbol: '$', flag: '🇺🇸' },
};

export function formatCurrency(value: number, currency: CurrencyCode) {
  return new Intl.NumberFormat(CURRENCIES[currency].locale, {
    style: 'currency', currency, maximumFractionDigits: currency === 'INR' ? 0 : 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatNumber(value: number, currency: CurrencyCode) {
  return new Intl.NumberFormat(CURRENCIES[currency].locale).format(Number.isFinite(value) ? value : 0);
}

export function formatDate(value: string, currency: CurrencyCode) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(CURRENCIES[currency].locale, { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(`${value}T12:00:00`));
}

export function today() { return new Date().toISOString().slice(0, 10); }

export function calculateAmount(quantity?: number, rate?: number, directAmount?: number) {
  if (quantity !== undefined && rate !== undefined && quantity >= 0 && rate >= 0) return quantity * rate;
  return directAmount ?? 0;
}
