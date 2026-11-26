import 'server-only';

import { unstable_cache } from 'next/cache';
import { createSupabasePublicClient } from '@/lib/supabase/server';
import { getUsdRate } from '@/lib/services/exchange-rate';
import { fragranceSlug } from '@/lib/utils/slug';
import { getFragrance, listFragranceSummaries } from '@/models/repositories/fragrance.repository';
import { listFragranceReviews, listReviewStats } from '@/models/repositories/review.repository';
import { getStoreConfig } from '@/models/repositories/store-config.repository';
import type { Fragrance, FragranceSummary, Review, ReviewStat, StoreConfig } from '@/models/types';

/**
 * Datos públicos de la tienda. Se cachean en el servidor (y en la CDN de Vercel) con la etiqueta
 * `catalog`; el panel la invalida cada vez que guarda un cambio.
 */

export const CATALOG_TAG = 'catalog';
/** Reseñas de clientes: se invalida al publicar, editar u ocultar una reseña. */
export const REVIEWS_TAG = 'reviews';
const REVALIDATE_SECONDS = 600;

export interface CatalogData {
  config: StoreConfig;
  fragrances: FragranceSummary[];
  usdRate: number;
  /** Promedio real de reseñas por perfume (solo los que tienen) */
  reviewStats: Record<string, ReviewStat>;
}

const loadCatalog = unstable_cache(
  async () => {
    const db = createSupabasePublicClient();
    const [config, fragrances] = await Promise.all([getStoreConfig(db), listFragranceSummaries(db)]);
    return { config, fragrances };
  },
  ['catalog-v1'],
  { tags: [CATALOG_TAG], revalidate: REVALIDATE_SECONDS },
);

const loadReviewStats = unstable_cache(async () => listReviewStats(createSupabasePublicClient()), ['review-stats-v1'], {
  tags: [REVIEWS_TAG],
  revalidate: REVALIDATE_SECONDS,
});

export async function getCatalog(): Promise<CatalogData> {
  const [data, usdRate, reviewStats] = await Promise.all([loadCatalog(), getUsdRate(), loadReviewStats()]);
  return { ...data, usdRate, reviewStats };
}

const loadReviews = unstable_cache(async (fragranceId: string) => listFragranceReviews(createSupabasePublicClient(), fragranceId), ['fragrance-reviews-v1'], {
  tags: [REVIEWS_TAG],
  revalidate: REVALIDATE_SECONDS,
});

/** Reseñas visibles de un perfume (cacheadas; se actualizan al publicar o moderar). */
export async function getFragranceReviews(fragranceId: string): Promise<Review[]> {
  try {
    return await loadReviews(fragranceId);
  } catch {
    return [];
  }
}

const loadFragrance = unstable_cache(
  async (id: string) => getFragrance(createSupabasePublicClient(), id),
  ['fragrance-v1'],
  { tags: [CATALOG_TAG], revalidate: REVALIDATE_SECONDS },
);

/** Fragancia completa por id (con pirámide), cacheada. */
export async function getFragranceById(id: string): Promise<Fragrance | null> {
  try {
    return await loadFragrance(id);
  } catch {
    return null;
  }
}

/** Busca por slug "casa-nombre", por id o por slug del nombre (enlaces antiguos). */
export async function getFragranceBySlug(slug: string): Promise<Fragrance | null> {
  const { fragrances } = await loadCatalog();
  const raw = decodeURIComponent(slug);
  const match =
    fragrances.find((f) => f.id === raw) ??
    fragrances.find((f) => fragranceSlug(f) === raw) ??
    fragrances.find((f) => fragranceSlug({ name: f.name }) === raw);
  return match ? loadFragrance(match.id) : null;
}
