'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { getSessionUser, requireAdminAction } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { COMMENT_MAX, reviewErrorMessage } from '@/models/domain/reviews';
import { getProfile } from '@/models/repositories/profile.repository';
import { approveReview, deleteReview, setReviewHidden, submitReview } from '@/models/repositories/review.repository';
import type { ActionResult, Longevity, ReviewInput, Sillage } from '@/models/types';
import { runAction, UserError } from './action-result';
import { REVIEWS_TAG } from './catalog.controller';

const LONGEVITY: Longevity[] = ['poca', 'media', 'larga'];
const SILLAGE: Sillage[] = ['suave', 'moderada', 'fuerte'];

/**
 * Envía o edita una reseña. Cualquiera puede opinar (con o sin cuenta):
 * con un pedido entregado sale como "Compra verificada" y se publica al momento;
 * si no, queda pendiente hasta que la tienda la apruebe.
 */
export async function submitReviewAction(input: ReviewInput): Promise<ActionResult<{ pending: boolean; verified: boolean }>> {
  return runAction(async () => {
    const rating = Math.round(Number(input.rating));
    if (!(rating >= 1 && rating <= 5)) throw new UserError('Elige de 1 a 5 estrellas.');
    const comment = String(input.comment ?? '').trim();
    if (comment.length > COMMENT_MAX) throw new UserError(`El comentario puede tener hasta ${COMMENT_MAX} caracteres.`);
    const db = await createSupabaseServerClient();
    try {
      const res = await submitReview(db, {
        fragranceId: String(input.fragranceId),
        rating,
        longevity: LONGEVITY.includes(input.longevity as Longevity) ? input.longevity : null,
        sillage: SILLAGE.includes(input.sillage as Sillage) ? input.sillage : null,
        comment,
        name: String(input.name ?? '').trim().slice(0, 60),
        visitor: input.visitor ? String(input.visitor).slice(0, 64) : null,
      });
      if (!res.pending) updateTag(REVIEWS_TAG);
      revalidatePath('/cuenta', 'layout');
      revalidatePath('/admin/resenas');
      return res;
    } catch (e) {
      throw new UserError(reviewErrorMessage(e instanceof Error ? e.message : ''));
    }
  });
}

/** Nombre de pila de la cuenta (para llenar el formulario de reseña si hay sesión). */
export async function getReviewerNameAction(): Promise<string> {
  const user = await getSessionUser();
  if (!user) return '';
  const db = await createSupabaseServerClient();
  const p = await getProfile(db, user.id).catch(() => null);
  return (p?.name ?? '').trim().split(/\s+/)[0] ?? '';
}

export async function approveReviewAction(id: string): Promise<ActionResult> {
  return runAction(async () => {
    const db = await requireAdminAction();
    await approveReview(db, id);
    updateTag(REVIEWS_TAG);
    revalidatePath('/admin/resenas');
    return undefined;
  });
}

export async function setReviewHiddenAction(id: string, hidden: boolean): Promise<ActionResult> {
  return runAction(async () => {
    const db = await requireAdminAction();
    await setReviewHidden(db, id, hidden);
    updateTag(REVIEWS_TAG);
    revalidatePath('/admin/resenas');
    return undefined;
  });
}

export async function deleteReviewAction(id: string): Promise<ActionResult> {
  return runAction(async () => {
    const db = await requireAdminAction();
    await deleteReview(db, id);
    updateTag(REVIEWS_TAG);
    revalidatePath('/admin/resenas');
    return undefined;
  });
}
