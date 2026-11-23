'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { DEFAULT_FILTER, type CatalogFilter } from '@/models/domain/catalog';

/**
 * Filtro del catálogo compartido: el menú lateral y el carrusel de casas también lo cambian.
 * Acepta ?q= y ?marca= en la URL para enlaces directos desde otras páginas.
 */
interface CatalogFilterContextValue {
  filter: CatalogFilter;
  setFilter: (f: CatalogFilter) => void;
  /** Aplica un filtro y lleva al catálogo (navega a la portada si hace falta). */
  showInCatalog: (patch: Partial<CatalogFilter>) => void;
}

const Ctx = createContext<CatalogFilterContextValue | null>(null);

export function CatalogFilterProvider({ children }: { children: ReactNode }) {
  const [filter, setFilter] = useState<CatalogFilter>(DEFAULT_FILTER);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname !== '/') return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const brand = params.get('marca');
    if (!q && !brand) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza el filtro con la URL al llegar a la portada
    setFilter({ ...DEFAULT_FILTER, query: q ?? '', brand: brand ?? 'ALL' });
    requestAnimationFrame(() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }));
  }, [pathname]);

  const showInCatalog = useCallback(
    (patch: Partial<CatalogFilter>) => {
      if (pathname === '/') {
        setFilter({ ...DEFAULT_FILTER, ...patch });
        document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      const params = new URLSearchParams();
      if (patch.query) params.set('q', patch.query);
      if (patch.brand && patch.brand !== 'ALL') params.set('marca', patch.brand);
      router.push(`/?${params.toString()}#catalogo`);
    },
    [pathname, router],
  );

  return <Ctx.Provider value={{ filter, setFilter, showInCatalog }}>{children}</Ctx.Provider>;
}

export function useCatalogFilter() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCatalogFilter debe usarse dentro de <CatalogFilterProvider>');
  return ctx;
}
