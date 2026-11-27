'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAction } from '@/lib/auth/session';
import { createSupabasePublicClient } from '@/lib/supabase/server';
import { deleteCoupon, quoteCoupon, saveCoupon } from '@/models/repositories/coupon.repository';
import type { ActionResult, CartLine, Coupon, CouponQuote } from '@/models/types';
import { runAction, UserError } from './action-result';

/** Código en mayúsculas, sin espacios ni acentos. */
const normalizeCode = async (code: string) =>
  String(code ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .slice(0, 20);

const cleanLines = (lines: CartLine[]) =>
  (lines ?? [])
    .filter((l) => l && typeof l.fragId === 'string' && typeof l.size === 'string')
    .slice(0, 60)
    .map((l) => ({ fragId: l.fragId, size: l.size, qty: Math.max(1, Math.min(50, Math.floor(Number(l.qty)) || 1)) }));

/** El cliente revisa cuánto le descuenta un código (lo calcula la base de datos). */
export async function quoteCouponAction(code: string, lines: CartLine[]): Promise<ActionResult<CouponQuote>> {
  return runAction(async () => {
    const c = await normalizeCode(code);
    if (!c) return { ok: false, message: 'Escribe tu código' };
    return quoteCoupon(createSupabasePublicClient(), c, cleanLines(lines));
  });
}

export async function saveCouponAction(input: Coupon, previousCode?: string): Promise<ActionResult> {
  return runAction(async () => {
    const db = await requireAdminAction();
    const code = await normalizeCode(input.code);
    if (!/^[A-Z0-9_-]{3,20}$/.test(code)) throw new UserError('El código debe tener de 3 a 20 letras o números, sin espacios');
    const kind = input.kind === 'amount' ? 'amount' : 'percent';
    const value = Math.round(Number(input.value) * 100) / 100;
    if (!(value > 0)) throw new UserError('Escribe cuánto descuenta el código');
    if (kind === 'percent' && value > 100) throw new UserError('El porcentaje no puede pasar de 100');
    const endsAt = input.endsAt && /^\d{4}-\d{2}-\d{2}$/.test(input.endsAt) ? input.endsAt : null;
    const maxUses = Number(input.maxUses) > 0 ? Math.floor(Number(input.maxUses)) : null;
    await saveCoupon(
      db,
      {
        code,
        kind,
        value,
        appliesTo: input.appliesTo === 'decants' || input.appliesTo === 'bottles' ? input.appliesTo : 'all',
        minSubtotal: Math.max(0, Number(input.minSubtotal) || 0),
        endsAt,
        maxUses,
        active: input.active !== false,
      },
      previousCode ? await normalizeCode(previousCode) : undefined,
    );
    revalidatePath('/admin/tienda');
    return undefined;
  });
}

export async function deleteCouponAction(code: string): Promise<ActionResult> {
  return runAction(async () => {
    const db = await requireAdminAction();
    await deleteCoupon(db, await normalizeCode(code));
    revalidatePath('/admin/tienda');
    return undefined;
  });
}
