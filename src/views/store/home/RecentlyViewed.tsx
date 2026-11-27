'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fragranceSlug } from '@/lib/utils/slug';
import { minSizePrice } from '@/models/domain/sizes';
import type { Fragrance } from '@/models/types';
import { SmartImage } from '@/views/shared/SmartImage';
import { useStore } from '../state/StoreProvider';

const KEY = 'jf26_recent';
const MAX = 10;

const read = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

/**
 * "Vistos recientemente": guardado solo en este teléfono o computadora.
 * Con `currentId` (en la ficha) registra la visita y no se muestra a sí mismo.
 */
export function RecentlyViewed({ currentId }: { currentId?: string }) {
  const { byId, sizes, price } = useStore();
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const prev = read();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- el historial vive en el navegador
    setIds(prev.filter((id) => id !== currentId));
    if (currentId) {
      try {
        localStorage.setItem(KEY, JSON.stringify([currentId, ...prev.filter((id) => id !== currentId)].slice(0, MAX)));
      } catch {
        // sin almacenamiento: no pasa nada
      }
    }
  }, [currentId]);

  const list = ids.map((id) => byId.get(id)).filter((f): f is NonNullable<typeof f> => !!f && !!f.image);
  if (!list.length) return null;
  const decants = sizes.filter((s) => s.kind === 'decant');

  return (
    <section className="mx-auto max-w-6xl py-6" aria-labelledby="recent-title">
      <h2 id="recent-title" className="px-4 text-lg font-extrabold">
        Vistos recientemente
      </h2>
      <div className="mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]" data-no-swipe>
        {list.map((f) => {
          const from = minSizePrice(decants, f as Fragrance);
          return (
            <Link key={f.id} href={`/perfume/${fragranceSlug(f)}`} className="w-32 shrink-0 snap-start">
              <span className="relative block aspect-square overflow-hidden rounded-2xl border border-cork bg-umber">
                <SmartImage src={f.image!} alt="" fill sizes="128px" className="object-contain p-2" />
              </span>
              <span className="mt-1.5 block truncate text-[11px] uppercase tracking-[0.1em] text-drift">{f.brand}</span>
              <span className="block truncate text-sm font-semibold text-cream">{f.name}</span>
              {from > 0 && <span className="block text-xs text-sand">desde {price(from)}</span>}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
