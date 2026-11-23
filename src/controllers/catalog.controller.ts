import 'server-only';

import { unstable_cache } from 'next/cache';
import { createSupabasePublicClient } from '@/lib/supabase/server';
import { getUsdRate } from '@/lib/services/exchange-rate';
import { fragranceSlug } from '@/lib/utils/slug';
import { getFragrance, listFragranceSummaries } from '@/models/repositories/fragrance.repository';
import { getStoreConfig } from '@/models/repositories/store-config.repository';
import type { Fragrance, FragranceSummary, StoreConfig } from '@/models/types';

/**
 * Datos públicos de la tienda. Se cachean en el servidor (y en la CDN de Vercel) con la etiqueta
 * `catalog`; el panel la invalida cada vez que guarda un cambio.
 */

export const CATALOG_TAG = 'catalog';
const REVALIDATE_SECONDS = 600;

export interface CatalogData {
  config: StoreConfig;
  fragrances: FragranceSummary[];
  usdRate: number;
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

export async function getCatalog(): Promise<CatalogData> {
  const [data, usdRate] = await Promise.all([loadCatalog(), getUsdRate()]);
  return { ...data, usdRate };
}

const loadFragrance = unstable_cache(
  async (id: string) => getFragrance(createSupabasePublicClient(), id),
  ['fragrance-v1'],
  { tags: [CATALOG_TAG], revalidate: REVALIDATE_SECONDS },
);

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
