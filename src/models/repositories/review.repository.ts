import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { MyReview, Review, ReviewInput, ReviewStat } from '../types';

/** Tabla `reviews`, vista `review_stats` y funciones `submit_review` / `my_reviews`. */

const COLUMNS = 'id, fragrance_id, rating, longevity, sillage, comment, author_name, hidden, verified, pending, created_at';

type Row = { id: string; fragrance_id: string; rating: number; longevity: Review['longevity']; sillage: Review['sillage']; comment: string; author_name: string; hidden: boolean; verified: boolean; pending: boolean; created_at: string };

const toReview = (r: Row): Review => ({
  id: r.id,
  fragranceId: r.fragrance_id,
  rating: Number(r.rating),
  longevity: r.longevity,
  sillage: r.sillage,
  comment: r.comment ?? '',
  authorName: r.author_name || 'Cliente',
  hidden: !!r.hidden,
  verified: !!r.verified,
  pending: !!r.pending,
  createdAt: r.created_at,
});

/** Reseñas visibles de un perfume, de la más nueva a la más vieja. */
export async function listFragranceReviews(db: SupabaseClient, fragranceId: string, limit = 50): Promise<Review[]> {
  const { data, error } = await db.from('reviews').select(COLUMNS).eq('fragrance_id', fragranceId).eq('hidden', false).eq('pending', false).order('created_at', { ascending: false }).limit(limit);
  if (error) throw new Error(`No se pudieron leer las reseñas: ${error.message}`);
  return ((data ?? []) as Row[]).map(toReview);
}

export async function listReviewStats(db: SupabaseClient): Promise<Record<string, ReviewStat>> {
  const { data, error } = await db.from('review_stats').select('fragrance_id, reviews, average');
  if (error) return {};
  return Object.fromEntries((data ?? []).map((r) => [r.fragrance_id as string, { reviews: Number(r.reviews), average: Number(r.average) }]));
}

/** Envía o edita una reseña. Devuelve si quedó verificada o pendiente de aprobación. */
export async function submitReview(db: SupabaseClient, input: ReviewInput): Promise<{ verified: boolean; pending: boolean }> {
  const { data, error } = await db.rpc('submit_review', {
    p_fragrance_id: input.fragranceId,
    p_rating: input.rating,
    p_longevity: input.longevity,
    p_sillage: input.sillage,
    p_comment: input.comment,
    p_name: input.name ?? '',
    p_visitor: input.visitor ?? null,
  });
  if (error) throw new Error(error.message);
  const r = (data ?? {}) as { verified?: boolean; pending?: boolean };
  return { verified: !!r.verified, pending: !!r.pending };
}

export async function listMyReviews(db: SupabaseClient): Promise<MyReview[]> {
  const { data, error } = await db.rpc('my_reviews');
  if (error) return [];
  return ((data ?? []) as Array<{ fragrance_id: string; rating: number; longevity: Review['longevity']; sillage: Review['sillage']; comment: string; hidden: boolean; pending: boolean; verified: boolean }>).map((r) => ({
    fragranceId: r.fragrance_id,
    rating: Number(r.rating),
    longevity: r.longevity,
    sillage: r.sillage,
    comment: r.comment ?? '',
    hidden: !!r.hidden,
    pending: !!r.pending,
    verified: !!r.verified,
  }));
}

/** Panel: todas las reseñas (también las ocultas). */
export async function adminListReviews(db: SupabaseClient): Promise<Review[]> {
  const { data, error } = await db.from('reviews').select(COLUMNS).order('created_at', { ascending: false }).limit(300);
  if (error) throw new Error(`No se pudieron cargar las reseñas: ${error.message}`);
  return ((data ?? []) as Row[]).map(toReview);
}

export async function setReviewHidden(db: SupabaseClient, id: string, hidden: boolean): Promise<void> {
  const { error } = await db.from('reviews').update({ hidden }).eq('id', id);
  if (error) throw new Error(`No se pudo actualizar la reseña: ${error.message}`);
}

export async function approveReview(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from('reviews').update({ pending: false, hidden: false }).eq('id', id);
  if (error) throw new Error(`No se pudo aprobar la reseña: ${error.message}`);
}

export async function deleteReview(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from('reviews').delete().eq('id', id);
  if (error) throw new Error(`No se pudo borrar la reseña: ${error.message}`);
}
