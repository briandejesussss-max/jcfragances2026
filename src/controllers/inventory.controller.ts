'use server';

import { updateTag } from 'next/cache';
import { requireAdminAction } from '@/lib/auth/session';
import { round1 } from '@/lib/utils/format';
import { firstPosition, getFragrance, saveFragrance } from '@/models/repositories/fragrance.repository';
import { getStoreConfig, saveStoreConfig } from '@/models/repositories/store-config.repository';
import type { ActionResult, Fragrance } from '@/models/types';
import { runAction, UserError } from './action-result';
import { CATALOG_TAG } from './catalog.controller';

export interface InventoryInput {
  /** id de la fragancia, o '__new__' para darla de alta rápido */
  fragranceId: string;
  kind: 'ml' | 'bottles';
  mode: 'add' | 'set';
  qty: number;
  newFragrance?: { name: string; brand: string; concentration: string; gender: string; prices: Record<string, number> };
}

/** Suma o fija ml de decants o botellas en inventario. */
export async function adjustInventoryAction(input: InventoryInput): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const db = await requireAdminAction();
    let qty = Number(input.qty);
    if (!(qty >= 0) || (input.mode === 'add' && qty <= 0)) throw new UserError('Ingresa una cantidad válida');
    if (input.kind === 'bottles') qty = Math.round(qty);

    let f: Fragrance | null;
    let position: number | undefined;
    if (input.fragranceId === '__new__') {
      const n = input.newFragrance;
      if (!n?.name.trim() || !n.brand.trim()) throw new UserError('Escribe nombre y casa de la fragancia');
      f = {
        id: `frag-${Date.now()}`,
        name: n.name.trim(),
        brand: n.brand.trim(),
        concentration: n.concentration.trim() || 'Eau de Parfum',
        gender: n.gender || 'Unisex',
        image: '',
        notes: '',
        prices: Object.fromEntries(
          ['3ml', '5ml', '10ml', 'bottle'].map((k) => [k, { price: Number(n.prices[k]) || 0, inStock: (Number(n.prices[k]) || 0) > 0 }]),
        ),
      };
      position = await firstPosition(db);
    } else {
      f = await getFragrance(db, input.fragranceId);
    }
    if (!f) throw new UserError('No se encontró la fragancia');

    const stock = { ...(f.stock ?? {}) };
    const base = Number.isFinite(stock[input.kind]) ? (stock[input.kind] as number) : 0;
    stock[input.kind] = round1(input.mode === 'add' ? base + qty : qty);

    await saveFragrance(db, { ...f, stock }, position);
    updateTag(CATALOG_TAG);
    return { id: f.id };
  });
}

/** Límite de ml para el aviso de "pocos ml disponibles". */
export async function saveLowThresholdAction(value: number): Promise<ActionResult> {
  return runAction(async () => {
    const db = await requireAdminAction();
    const config = await getStoreConfig(db);
    await saveStoreConfig(db, { ...config, lowMlThreshold: Math.max(0, Number(value) || 0) });
    updateTag(CATALOG_TAG);
    return undefined;
  });
}
