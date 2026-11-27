import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CartLine, Coupon, CouponQuote } from '../types';

/** Tabla `coupons` (solo propietario) y la función pública `coupon_quote`. */

interface CouponRow {
  code: string;
  kind: Coupon['kind'];
  value: number | string;
  applies_to: Coupon['appliesTo'];
  min_subtotal: number | string;
  ends_at: string | null;
  max_uses: number | null;
  active: boolean;
}

const toCoupon = (r: CouponRow): Coupon => ({
  code: r.code,
  kind: r.kind,
  value: Number(r.value),
  appliesTo: r.applies_to,
  minSubtotal: Number(r.min_subtotal),
  endsAt: r.ends_at,
  maxUses: r.max_uses,
  active: r.active,
});

export async function listCoupons(db: SupabaseClient): Promise<Coupon[]> {
  const [{ data, error }, uses] = await Promise.all([db.from('coupons').select('*').order('created_at', { ascending: false }), db.rpc('coupon_uses')]);
  if (error) throw new Error(`No se pudieron leer los códigos: ${error.message}`);
  const count = new Map(((uses.data ?? []) as Array<{ code: string; uses: number }>).map((u) => [u.code, Number(u.uses)]));
  return ((data ?? []) as CouponRow[]).map((r) => ({ ...toCoupon(r), uses: count.get(r.code) ?? 0 }));
}

export async function saveCoupon(db: SupabaseClient, c: Coupon, previousCode?: string): Promise<void> {
  const row = {
    code: c.code,
    kind: c.kind,
    value: c.value,
    applies_to: c.appliesTo,
    min_subtotal: c.minSubtotal,
    ends_at: c.endsAt,
    max_uses: c.maxUses,
    active: c.active,
  };
  if (previousCode && previousCode !== c.code) {
    const { error } = await db.from('coupons').update(row).eq('code', previousCode);
    if (error) throw new Error(error.code === '23505' ? 'Ya existe otro código con ese nombre' : `No se pudo guardar: ${error.message}`);
    return;
  }
  const { error } = await db.from('coupons').upsert(row);
  if (error) throw new Error(`No se pudo guardar el código: ${error.message}`);
}

export async function deleteCoupon(db: SupabaseClient, code: string): Promise<void> {
  const { error } = await db.from('coupons').delete().eq('code', code);
  if (error) throw new Error(`No se pudo borrar el código: ${error.message}`);
}

export async function quoteCoupon(db: SupabaseClient, code: string, lines: CartLine[]): Promise<CouponQuote> {
  const { data, error } = await db.rpc('coupon_quote', { p_code: code, p_items: lines });
  if (error || !data) return { ok: false, message: 'No pudimos revisar el código. Intenta de nuevo' };
  const d = data as { ok: boolean; code?: string; discount?: number; message?: string };
  return { ok: !!d.ok, code: d.code, discount: Number(d.discount ?? 0), message: String(d.message ?? '') };
}
