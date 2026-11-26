'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { requireAdminAction, requireCustomerAction } from '@/lib/auth/session';
import { COMMENT_MAX, reviewErrorMessage } from '@/models/domain/reviews';
import { deleteReview, setReviewHidden, upsertReview } from '@/models/repositories/review.repository';
import type { ActionResult, Longevity, ReviewInput, Sillage } from '@/models/types';
import { runAction, UserError } from './action-result';
import { REVIEWS_TAG } from './catalog.controller';

const LONGEVITY: Longevity[] = ['poca', 'media', 'larga'];
const SILLAGE: Sillage[] = ['suave', 'moderada', 'fuerte'];

/** Publica o edita la reseña del cliente (la base de datos verifica que el pedido esté entregado). */
export async function submitReviewAction(input: ReviewInput): Promise<ActionResult> {
  return runAction(async () => {
    const { db } = await requireCustomerAction();
    const rating = Math.round(Number(input.rating));
    if (!(rating >= 1 && rating <= 5)) throw new UserError('Elige de 1 a 5 estrellas.');
    const comment = String(input.comment ?? '').trim();
    if (comment.length > COMMENT_MAX) throw new UserError(`El comentario puede tener hasta ${COMMENT_MAX} caracteres.`);
    try {
      await upsertReview(db, {
        fragranceId: String(input.fragranceId),
        rating,
        longevity: LONGEVITY.includes(input.longevity as Longevity) ? input.longevity : null,
        sillage: SILLAGE.includes(input.sillage as Sillage) ? input.sillage : null,
        comment,
      });
    } catch (e) {
      throw new UserError(reviewErrorMessage(e instanceof Error ? e.message : ''));
    }
    updateTag(REVIEWS_TAG);
    revalidatePath('/cuenta', 'layout');
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
