import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Fragrance, FragranceSummary } from '../types';

/**
 * Tabla `fragrances` (id, position, data jsonb).
 * Los listados piden solo los campos que usan: la pirámide puede pesar cientos de KB por fila.
 */

const SUMMARY_COLUMNS =
  'id, position, name:data->>name, brand:data->>brand, concentration:data->>concentration, gender:data->>gender, image:data->>image, notes:data->>notes, comingSoon:data->comingSoon, profile:data->profile, prices:data->prices, stock:data->stock';

type SummaryRow = Omit<FragranceSummary, 'comingSoon'> & { comingSoon: boolean | null };

const toSummary = (r: SummaryRow): FragranceSummary => ({
  ...r,
  name: r.name ?? '',
  brand: r.brand ?? '',
  comingSoon: !!r.comingSoon,
  prices: r.prices ?? {},
  profile: r.profile ?? undefined,
  stock: r.stock ?? undefined,
});

export async function listFragranceSummaries(db: SupabaseClient): Promise<FragranceSummary[]> {
  const { data, error } = await db.from('fragrances').select(SUMMARY_COLUMNS).order('position');
  if (error) throw new Error(`No se pudo leer el catálogo: ${error.message}`);
  return (data as unknown as SummaryRow[]).map(toSummary);
}

export async function getFragrance(db: SupabaseClient, id: string): Promise<Fragrance | null> {
  const { data, error } = await db.from('fragrances').select('id, data').eq('id', id).maybeSingle();
  if (error) throw new Error(`No se pudo leer la fragancia: ${error.message}`);
  return data ? { ...(data.data as Fragrance), id: data.id } : null;
}

/** Fragancias completas por id (para validar pedidos y descontar inventario). */
export async function getFragrancesByIds(db: SupabaseClient, ids: string[]): Promise<Map<string, Fragrance>> {
  const map = new Map<string, Fragrance>();
  if (!ids.length) return map;
  const { data, error } = await db.from('fragrances').select('id, data').in('id', ids);
  if (error) throw new Error(`No se pudo leer el inventario: ${error.message}`);
  for (const r of data ?? []) map.set(r.id, { ...(r.data as Fragrance), id: r.id });
  return map;
}

export async function saveFragrance(db: SupabaseClient, f: Fragrance, position?: number): Promise<void> {
  const row: Record<string, unknown> = { id: f.id, data: f, updated_at: new Date().toISOString() };
  if (position !== undefined) row.position = position;
  const { error } = await db.from('fragrances').upsert(row);
  if (error) throw new Error(`No se pudo guardar la fragancia: ${error.message}`);
}

/** Guarda solo el JSON de varias fragancias existentes (p. ej. al descontar inventario). */
export async function saveFragranceData(db: SupabaseClient, list: Fragrance[]): Promise<void> {
  const now = new Date().toISOString();
  for (const f of list) {
    const { error } = await db.from('fragrances').update({ data: f, updated_at: now }).eq('id', f.id);
    if (error) throw new Error(`No se pudo actualizar ${f.name}: ${error.message}`);
  }
}

export async function deleteFragrance(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from('fragrances').delete().eq('id', id);
  if (error) throw new Error(`No se pudo eliminar la fragancia: ${error.message}`);
}

/** Posición para una fragancia nueva: queda al inicio del catálogo. */
export async function firstPosition(db: SupabaseClient): Promise<number> {
  const { data } = await db.from('fragrances').select('position').order('position').limit(1).maybeSingle();
  return (data?.position ?? 1) - 1;
}
