'use server';

import { updateTag } from 'next/cache';
import { requireAdminAction } from '@/lib/auth/session';
import { composePyramid, hasPyramid, PYRAMID_SECTIONS } from '@/models/domain/pyramid';
import {
  deleteFragrance,
  firstPosition,
  getFragrance,
  saveFragrance,
} from '@/models/repositories/fragrance.repository';
import type { ActionResult, Fragrance, Pyramid, SizePrice } from '@/models/types';
import { runAction, UserError } from './action-result';
import { CATALOG_TAG } from './catalog.controller';

const isRemoteUrl = (v: unknown) => typeof v === 'string' && (v === '' || /^https?:\/\//i.test(v));

function sanitizePyramid(py: Pyramid | undefined): Pyramid | undefined {
  if (!py) return undefined;
  const out: Pyramid = { top: [], mid: [], base: [] };
  for (const s of PYRAMID_SECTIONS) {
    out[s] = (py[s] ?? [])
      .filter((n) => n && String(n.t ?? '').trim())
      .map((n) => ({ e: String(n.e ?? '').slice(0, 8), t: String(n.t).trim().slice(0, 60), ...(n.img ? { img: String(n.img) } : {}) }));
  }
  return hasPyramid(out) ? out : undefined;
}

/**
 * Crea o actualiza una fragancia. Las fotos ya llegan como URL de Storage
 * (el formulario las sube antes); aquí se rechazan imágenes en base64 para no inflar la base de datos.
 */
export async function saveFragranceAction(input: Fragrance): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const db = await requireAdminAction();
    const name = String(input.name ?? '').trim();
    const brand = String(input.brand ?? '').trim();
    if (!name || !brand) throw new UserError('Escribe el nombre y la casa de la fragancia');
    if (!isRemoteUrl(input.image ?? '') || !isRemoteUrl(input.bgImage ?? ''))
      throw new UserError('Las fotos deben subirse como archivo o pegarse como enlace https');

    const pyramid = sanitizePyramid(input.pyramid);
    const existing = input.id ? await getFragrance(db, input.id) : null;
    const notesText = String(input.notes ?? '').trim();
    // Si las notas eran solo la pirámide en texto, se regeneran con la pirámide nueva.
    const oldComposed = composePyramid(existing?.pyramid);
    const notes = !notesText || (oldComposed && notesText === oldComposed) ? composePyramid(pyramid) : notesText;

    const fragrance: Fragrance = {
      ...(existing ?? {}),
      id: existing?.id ?? `frag-${Date.now()}`,
      name,
      brand,
      concentration: String(input.concentration ?? '').trim(),
      gender: String(input.gender ?? 'Unisex'),
      image: input.image || '',
      bgImage: input.bgImage || undefined,
      notes,
      comingSoon: !!input.comingSoon,
      profile: input.profile,
      pyramid,
      prices: input.prices ?? {},
      stock: input.stock ?? existing?.stock,
    };

    await saveFragrance(db, fragrance, existing ? undefined : await firstPosition(db));
    updateTag(CATALOG_TAG);
    return { id: fragrance.id };
  });
}

export async function deleteFragranceAction(id: string): Promise<ActionResult> {
  return runAction(async () => {
    const db = await requireAdminAction();
    await deleteFragrance(db, id);
    updateTag(CATALOG_TAG);
    return undefined;
  });
}

/** Aplica los precios sugeridos por la calculadora de decants (claves 3ml, 5ml, 10ml). */
export async function applyDecantPricesAction(id: string, prices: Record<string, number>): Promise<ActionResult> {
  return runAction(async () => {
    const db = await requireAdminAction();
    const f = await getFragrance(db, id);
    if (!f) throw new UserError('No se encontró la fragancia');
    const next = { ...(f.prices ?? {}) };
    for (const [key, price] of Object.entries(prices)) {
      if (!/^\d+ml$/.test(key) || !(price > 0)) continue;
      const current = next[key] as SizePrice | undefined;
      next[key] = { ...(current ?? {}), inStock: current?.inStock ?? true, price: Math.round(price * 100) / 100 };
    }
    await saveFragrance(db, { ...f, prices: next });
    updateTag(CATALOG_TAG);
    return undefined;
  });
}
