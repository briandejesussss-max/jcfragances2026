'use client';

import { SmartImage } from '@/views/shared/SmartImage';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { PLACEHOLDER_IMAGE } from '@/config/store';
import { cn } from '@/lib/utils/cn';
import { fragranceSlug } from '@/lib/utils/slug';
import { minSizePrice } from '@/models/domain/sizes';
import type { FragranceSummary } from '@/models/types';
import { useStore } from '../state/StoreProvider';

/** Estante "Para ti": las fragancias guardadas en el armario o, si no hay, las primeras del catálogo. */
export function CuratedShelf() {
  const { fragrances, shelf, toggleShelf, sizes, price, byId } = useStore();
  const saved = shelf.map((id) => byId.get(id)).filter((f): f is FragranceSummary => !!f);
  const list = (saved.length ? saved : fragrances).slice(0, 4);
  if (!list.length) return null;

  return (
    <section id="para-ti" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-10">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-sand">{saved.length ? 'Tu armario' : 'Seleccionado para ti'}</p>
          <h3 className="mt-1 text-xl sm:text-2xl">Combina con tu armario</h3>
        </div>
        <span className="text-[11px] text-sand">❤️ Guarda tus favoritos</span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {list.map((f) => {
          const inShelf = shelf.includes(f.id);
          return (
            <div key={f.id} className="relative rounded-2xl border border-cork bg-umber p-2.5">
              <div className="mb-1.5 flex items-center justify-between text-[9px] uppercase tracking-[0.08em]">
                <span>{inShelf ? 'En armario' : 'Para ti'}</span>
                <button type="button" onClick={() => toggleShelf(f.id)} aria-label="Guardar en mi armario" className="p-1 text-sand hover:text-ember">
                  <Heart className={cn('size-3.5', inShelf && 'fill-ember text-ember')} />
                </button>
              </div>
              <Link href={`/perfume/${fragranceSlug(f)}`} className="block">
                <div className="relative h-28 sm:h-32">
                  <SmartImage src={f.image || PLACEHOLDER_IMAGE(f.name)} alt={f.name} fill sizes="25vw" className="object-contain p-2" />
                </div>
                <div className="pt-1.5 text-center">
                  <span className="block truncate text-[9px] uppercase tracking-[0.1em] text-sand">{f.brand}</span>
                  <h4 className="truncate text-xs sm:text-sm">{f.name}</h4>
                  <span className="font-mono text-[10px]">{f.comingSoon ? '⏳ Próximamente' : `Desde ${price(minSizePrice(sizes, f))}`}</span>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
