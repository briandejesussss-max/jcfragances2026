import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppSettings, Movement, MovementInput, TaxBase } from '../types';

/** Tablas `movements` (ingresos y gastos) y `app_settings` (reserva de impuestos). */

export async function listMovements(db: SupabaseClient): Promise<Movement[]> {
  const { data, error } = await db.from('movements').select('*').order('date', { ascending: false }).limit(5000);
  if (error) throw new Error(`No se pudieron cargar los movimientos: ${error.message}`);
  return (data ?? []).map((r) => ({ ...r, amount: Number(r.amount) }));
}

export async function insertMovement(db: SupabaseClient, m: MovementInput): Promise<void> {
  const { error } = await db.from('movements').insert(m);
  if (error) throw new Error(`No se pudo guardar el movimiento: ${error.message}`);
}

export async function updateMovement(db: SupabaseClient, id: string, m: MovementInput): Promise<void> {
  const { error } = await db.from('movements').update(m).eq('id', id);
  if (error) throw new Error(`No se pudo guardar el movimiento: ${error.message}`);
}

export async function deleteMovement(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from('movements').delete().eq('id', id);
  if (error) throw new Error(`No se pudo eliminar el movimiento: ${error.message}`);
}

export async function getAppSettings(db: SupabaseClient): Promise<AppSettings> {
  const { data } = await db.from('app_settings').select('*').eq('id', 1).maybeSingle();
  return { taxReservePct: Number(data?.tax_reserve_pct ?? 0), taxBase: (data?.tax_base as TaxBase) ?? 'beneficio' };
}

export async function saveAppSettings(db: SupabaseClient, s: AppSettings): Promise<void> {
  const { error } = await db
    .from('app_settings')
    .upsert({ id: 1, tax_reserve_pct: s.taxReservePct, tax_base: s.taxBase, updated_at: new Date().toISOString() });
  if (error) throw new Error(`No se pudo guardar la configuración: ${error.message}`);
}
