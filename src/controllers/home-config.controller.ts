'use server';

import { updateTag } from 'next/cache';
import { requireAdminAction } from '@/lib/auth/session';
import { sanitizeHome } from '@/models/domain/home';
import { listFragranceSummaries } from '@/models/repositories/fragrance.repository';
import { getStoreConfig, saveStoreConfig } from '@/models/repositories/store-config.repository';
import type { ActionResult, HomeConfig } from '@/models/types';
import { runAction } from './action-result';
import { CATALOG_TAG } from './catalog.controller';

/** Panel → Tienda → Portada: perfume del desglose, ocasiones y fotos de Instagram. */
export async function saveHomeConfigAction(input: HomeConfig): Promise<ActionResult> {
  return runAction(async () => {
    const db = await requireAdminAction();
    const [current, fragrances] = await Promise.all([getStoreConfig(db), listFragranceSummaries(db)]);
    const home = sanitizeHome(input, new Set(fragrances.map((f) => f.id)));
    await saveStoreConfig(db, { ...current, home });
    updateTag(CATALOG_TAG);
    return undefined;
  });
}
