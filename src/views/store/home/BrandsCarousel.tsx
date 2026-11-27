'use client';

import { brandCounts } from '@/models/domain/catalog';
import { useCatalogFilter } from '../state/CatalogFilterContext';
import { useStore } from '../state/StoreProvider';

/** Carrusel de casas armado con las fragancias del catálogo; al tocar una, filtra el catálogo. */
export function BrandsCarousel() {
  const { fragrances } = useStore();
  const { showInCatalog } = useCatalogFilter();
  const brands = brandCounts(fragrances);
  if (brands.length < 2) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pt-12" aria-label="Casas">
      <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-sand">Explora por casa</p>
      <div className="flex snap-x gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {brands.map(({ brand, count }) => (
          <button
            key={brand}
            type="button"
            onClick={() => showInCatalog({ brand })}
            className="shrink-0 snap-start rounded-2xl border border-cork bg-umber px-4 py-3 text-left transition hover:border-sand"
          >
            <span className="block text-sm font-medium uppercase">{brand}</span>
            <span className="text-[11px] text-sand">
              {count} {count === 1 ? 'fragancia' : 'fragancias'}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
