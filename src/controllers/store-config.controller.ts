'use server';

import { updateTag } from 'next/cache';
import { requireAdminAction } from '@/lib/auth/session';
import { formatMl } from '@/lib/utils/format';
import { getStoreConfig, saveStoreConfig } from '@/models/repositories/store-config.repository';
import type { ActionResult, SizeConfig, StoreConfig } from '@/models/types';
import { runAction, UserError } from './action-result';
import { CATALOG_TAG } from './catalog.controller';

type StoreConfigInput = Pick<StoreConfig, 'name' | 'tagline' | 'whatsapp' | 'instagram' | 'instagramUrl' | 'notes' | 'logo' | 'sizes' | 'freeShippingFrom' | 'promo'>;

function cleanSizes(sizes: SizeConfig[]): SizeConfig[] {
  return (sizes ?? [])
    .map((s) => {
      const ml = Number(s.ml) || 0;
      const kind = s.kind === 'pieza' || s.kind === 'parcial' ? s.kind : 'decant';
      const label = String(s.label ?? '').trim() || (kind === 'parcial' ? 'Botella parcial' : ml ? `${formatMl(ml)} ml` : '');
      return { key: String(s.key || `s${Date.now().toString(36)}`), label, ml, kind, partial: kind === 'parcial' } as SizeConfig;
    })
    .filter((s) => s.label && (s.ml > 0 || s.kind === 'parcial'));
}

function cleanPromo(p: StoreConfig['promo']): StoreConfig['promo'] {
  const text = String(p?.text ?? '').trim().slice(0, 140);
  if (!text) return undefined;
  const link = String(p?.link ?? '').trim();
  if (link && !/^(https?:\/\/|\/(?!\/))/i.test(link)) throw new UserError('El link de la promoción debe empezar con / o con https://');
  const endsAt = String(p?.endsAt ?? '').trim();
  if (endsAt && !/^\d{4}-\d{2}-\d{2}$/.test(endsAt)) throw new UserError('La fecha de fin de la promoción no es válida');
  return { text, link: link || undefined, endsAt: endsAt || undefined };
}

export async function saveStoreConfigAction(input: StoreConfigInput): Promise<ActionResult> {
  return runAction(async () => {
    const db = await requireAdminAction();
    const sizes = cleanSizes(input.sizes);
    if (!sizes.length) throw new UserError('Deja al menos una presentación con nombre y ml');
    if (!String(input.name ?? '').trim() || !String(input.whatsapp ?? '').trim())
      throw new UserError('El nombre de la tienda y el WhatsApp son obligatorios');
    if (input.logo && !/^https?:\/\//i.test(input.logo)) throw new UserError('Sube el logotipo como archivo');

    const current = await getStoreConfig(db);
    await saveStoreConfig(db, {
      ...current,
      name: input.name.trim(),
      tagline: String(input.tagline ?? '').trim(),
      whatsapp: input.whatsapp.trim(),
      instagram: String(input.instagram ?? '').trim(),
      instagramUrl: String(input.instagramUrl ?? '').trim(),
      notes: String(input.notes ?? '').trim(),
      logo: input.logo ?? '',
      sizes,
      freeShippingFrom: Math.max(0, Math.round(Number(input.freeShippingFrom) || 0)),
      promo: cleanPromo(input.promo),
    });
    updateTag(CATALOG_TAG);
    return undefined;
  });
}
