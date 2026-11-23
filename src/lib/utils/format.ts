import type { Currency } from '@/models/types';

/** Redondea a 1 decimal (ml de inventario). */
export const round1 = (n: number) => Math.round(n * 10) / 10;

export const formatMl = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/**
 * Precio para la tienda. Los precios se guardan en MXN; en USD se convierten con el tipo de cambio.
 * Un precio en 0 o inválido se muestra como "Agotado", igual que en el sitio original.
 */
export function formatPrice(value: number | string | undefined, currency: Currency = 'MXN', usdRate = 0): string {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (!Number.isFinite(num) || num <= 0) return 'Agotado';
  if (currency === 'USD' && usdRate > 0) return `USD $${(num / usdRate).toFixed(2)}`;
  return `$${num.toFixed(0)}`;
}

/** Monto exacto en pesos para el panel (finanzas, pedidos). */
export const formatMoney = (n: number) =>
  Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' });

/** Fecha de hoy (YYYY-MM-DD) en la zona horaria de la tienda. */
export const todayInMexico = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Mexico_City' });

export const formatClabe = (clabe: string) => clabe.replace(/(\d{3})(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4 $5');
