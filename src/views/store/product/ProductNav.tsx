'use client';

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { PLACEHOLDER_IMAGE } from '@/config/store';
import { cn } from '@/lib/utils/cn';
import { fragranceSlug } from '@/lib/utils/slug';
import { DEFAULT_FILTER, filterCatalog } from '@/models/domain/catalog';
import type { FragranceSummary } from '@/models/types';
import { SmartImage } from '@/views/shared/SmartImage';
import { useCatalogFilter } from '../state/CatalogFilterContext';
import { useStore } from '../state/StoreProvider';

/**
 * Perfume anterior y siguiente. Sigue el orden y los filtros con los que el cliente
 * venía viendo el catálogo (si el perfume no está en ese filtro, usa el catálogo completo).
 * Da la vuelta: después del último sigue el primero.
 */
function useNeighbors(id: string) {
  const { fragrances } = useStore();
  const { filter } = useCatalogFilter();
  return useMemo(() => {
    let list = filterCatalog([...fragrances], filter);
    if (!list.some((f) => f.id === id)) list = filterCatalog([...fragrances], DEFAULT_FILTER);
    const i = list.findIndex((f) => f.id === id);
    if (i === -1 || list.length < 2) return null;
    const at = (k: number) => list[(k + list.length) % list.length];
    return { prev: at(i - 1), next: at(i + 1), index: i + 1, total: list.length };
  }, [fragrances, filter, id]);
}

const href = (f: FragranceSummary) => `/perfume/${fragranceSlug(f)}`;

/** Barra superior: "← Catálogo" y las flechas con el contador "3 / 30". También funciona con ← → del teclado. */
export function ProductTopNav({ id }: { id: string }) {
  const n = useNeighbors(id);
  const router = useRouter();

  useEffect(() => {
    if (!n) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.altKey || e.ctrlKey || e.metaKey || t?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key === 'ArrowLeft') router.push(href(n.prev));
      if (e.key === 'ArrowRight') router.push(href(n.next));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [n, router]);

  return (
    <div className="flex items-center justify-between gap-3">
      <Link href="/#catalogo" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-sand hover:text-cream">
        <ArrowLeft className="size-4" /> Catálogo
      </Link>
      {n && (
        <div className="flex items-center gap-2">
          <ArrowButton f={n.prev} dir="prev" small />
          <span className="font-mono text-[11px] text-sand" aria-label={`Perfume ${n.index} de ${n.total}`}>
            {n.index} / {n.total}
          </span>
          <ArrowButton f={n.next} dir="next" small />
        </div>
      )}
    </div>
  );
}

/** Foto del perfume con flechas a los lados; también se puede deslizar con el dedo. */
export function ProductStageNav({ id, children }: { id: string; children: ReactNode }) {
  const n = useNeighbors(id);
  const router = useRouter();
  const start = useRef<{ x: number; y: number } | null>(null);

  return (
    <div
      className="relative"
      onTouchStart={(e) => (start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        const s = start.current;
        start.current = null;
        if (!s || !n) return;
        const dx = e.changedTouches[0].clientX - s.x;
        const dy = e.changedTouches[0].clientY - s.y;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) router.push(href(dx < 0 ? n.next : n.prev));
      }}
    >
      {children}
      {n && (
        <>
          <ArrowButton f={n.prev} dir="prev" className="absolute left-0 top-1/2 -translate-y-1/2" />
          <ArrowButton f={n.next} dir="next" className="absolute right-0 top-1/2 -translate-y-1/2" />
        </>
      )}
    </div>
  );
}

/** Al final de la ficha: tarjetas con foto y nombre del anterior y el siguiente. */
export function ProductBottomNav({ id }: { id: string }) {
  const n = useNeighbors(id);
  if (!n) return null;
  return (
    <nav aria-label="Más perfumes" className="mx-auto mt-6 grid max-w-5xl grid-cols-2 gap-3 px-4">
      {([
        [n.prev, 'prev'],
        [n.next, 'next'],
      ] as const).map(([f, dir]) => (
        <Link
          key={dir}
          href={href(f)}
          className={cn('flex min-w-0 items-center gap-3 rounded-2xl border border-cork bg-umber p-3 transition hover:border-sand', dir === 'next' && 'flex-row-reverse text-right')}
        >
          <span className="relative size-14 shrink-0">
            <SmartImage src={f.image || PLACEHOLDER_IMAGE(f.name)} alt="" fill sizes="56px" className="object-contain" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.08em] text-ember">
              {dir === 'prev' ? (
                <>
                  <ChevronLeft className="size-3" /> Anterior
                </>
              ) : (
                <>
                  Siguiente <ChevronRight className="size-3" />
                </>
              )}
            </span>
            <span className="block truncate text-[10px] uppercase text-sand">{f.brand}</span>
            <span className="block truncate text-sm">{f.name}</span>
          </span>
        </Link>
      ))}
    </nav>
  );
}

function ArrowButton({ f, dir, small, className }: { f: FragranceSummary; dir: 'prev' | 'next'; small?: boolean; className?: string }) {
  const Icon = dir === 'prev' ? ChevronLeft : ChevronRight;
  return (
    <Link
      href={href(f)}
      aria-label={`${dir === 'prev' ? 'Perfume anterior' : 'Perfume siguiente'}: ${f.brand} ${f.name}`}
      title={`${f.brand} ${f.name}`}
      className={cn(
        'grid shrink-0 place-items-center rounded-full border border-cork bg-walnut/70 text-cream backdrop-blur transition hover:border-cream active:scale-95',
        small ? 'size-9' : 'size-11',
        className,
      )}
    >
      <Icon className={small ? 'size-4' : 'size-5'} />
    </Link>
  );
}
