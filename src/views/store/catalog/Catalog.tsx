'use client';

import { useMemo, useState } from 'react';
import { PAGE_SIZE } from '@/config/store';
import { brandsOf, DEFAULT_FILTER, filterCatalog, type CatalogFilter } from '@/models/domain/catalog';
import { Button } from '@/views/shared/Button';
import { useStore } from '../state/StoreProvider';
import { useCatalogFilter } from '../state/CatalogFilterContext';
import { CatalogFilters } from './CatalogFilters';
import { FragranceCard } from './FragranceCard';

/** Catálogo principal: búsqueda, filtros y paginación de 12 en 12. */
export function Catalog() {
  const { fragrances } = useStore();
  const { filter, setFilter } = useCatalogFilter();
  const [visible, setVisible] = useState(PAGE_SIZE);

  const brands = useMemo(() => brandsOf(fragrances), [fragrances]);
  const filtered = useMemo(() => filterCatalog([...fragrances], filter), [fragrances, filter]);
  const shown = filtered.slice(0, visible);

  const update = (patch: Partial<CatalogFilter>) => {
    setFilter({ ...filter, ...patch });
    setVisible(PAGE_SIZE);
  };

  return (
    <section id="catalogo" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-10 sm:py-14">
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.14em] text-sand">Catálogo</p>
        <h2 className="mt-2 text-[clamp(1.8rem,6vw,2.55rem)]">Encuentra tu firma olfativa</h2>
      </div>

      <CatalogFilters filter={filter} brands={brands} onChange={update} />

      {shown.length === 0 ? (
        <div className="py-16 text-center text-sand">
          <p className="text-2xl text-cream">✦</p>
          <p className="mt-2">No encontramos fragancias con esos filtros.</p>
          <Button variant="link" className="mt-3" onClick={() => update(DEFAULT_FILTER)}>
            Limpiar filtros
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {shown.map((f, i) => (
              <FragranceCard key={f.id} fragrance={f} priority={i < 3} />
            ))}
          </div>
          <div className="mt-8 flex flex-col items-center gap-3">
            <p className="text-xs text-sand">
              Mostrando {shown.length} de {filtered.length} fragancias
            </p>
            {shown.length < filtered.length && (
              <Button variant="ghost" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                Ver más fragancias
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
