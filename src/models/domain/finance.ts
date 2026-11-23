import type { Movement, MovementType, TaxBase } from '../types';

/** Cálculos del panel de finanzas. Todo se suma en centavos para evitar errores de redondeo. */

export const cents = (n: number | string) => Math.round(Number(n) * 100);

export const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const MOVEMENT_CATEGORIES: Record<MovementType, string[]> = {
  ingreso: ['Venta', 'Servicio de guías', 'Otro ingreso'],
  gasto: ['Compra de mercancía', 'Envío / paquetería', 'Empaque', 'Publicidad', 'Comisiones', 'Impuestos', 'Otro gasto'],
};

export interface MonthTotals {
  /** Ingresos en centavos */
  income: number;
  /** Gastos en centavos */
  expenses: number;
  /** Balance en centavos */
  balance: number;
  /** Monto a reservar para impuestos en centavos */
  reserve: number;
}

export function totals(rows: Pick<Movement, 'type' | 'amount'>[], pct = 0, base: TaxBase = 'beneficio'): MonthTotals {
  let income = 0;
  let expenses = 0;
  for (const r of rows) {
    const c = cents(r.amount);
    if (r.type === 'ingreso') income += c;
    else expenses += c;
  }
  const balance = income - expenses;
  const basis = base === 'ingresos' ? income : balance;
  return { income, expenses, balance, reserve: Math.max(0, Math.round((basis * Number(pct || 0)) / 100)) };
}

/** Mueve un mes "YYYY-MM" hacia adelante o atrás. */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const monthLabel = (month: string) => `${MONTHS[Number(month.slice(5)) - 1]} ${month.slice(0, 4)}`;

export const isMonth = (s: string | undefined): s is string => !!s && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);

export const inMonth = <T extends Pick<Movement, 'date'>>(rows: T[], month: string) => rows.filter((r) => r.date.startsWith(month));

export const centsToMoney = (c: number) => (c / 100).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
