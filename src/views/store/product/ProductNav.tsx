'use client';

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { fragranceSlug } from '@/lib/utils/slug';
import { DEFAULT_FILTER, filterCatalog } from '@/models/domain/catalog';
import type { FragranceSummary } from '@/models/types';
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
    return { prev: at(i - 1), next: at(i + 1) };
  }, [fragrances, filter, id]);
}

const href = (f: FragranceSummary) => `/perfume/${fragranceSlug(f)}`;

/** Flechas flotantes (siempre visibles) para ir al perfume anterior o siguiente. También con ← → del teclado. */
export function ProductArrows({ id }: { id: string }) {
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

  if (!n) return null;
  return (
    <>
      <ArrowButton f={n.prev} dir="prev" className="left-3 lg:left-5" />
      <ArrowButton f={n.next} dir="next" className="right-3 lg:right-5" />
    </>
  );
}

/** Deslizar el dedo sobre la foto: izquierda = siguiente, derecha = anterior. */
export function ProductSwipe({ id, children }: { id: string; children: ReactNode }) {
  const n = useNeighbors(id);
  const router = useRouter();
  const start = useRef<{ x: number; y: number } | null>(null);
  return (
    <div
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
    </div>
  );
}

function ArrowButton({ f, dir, className }: { f: FragranceSummary; dir: 'prev' | 'next'; className?: string }) {
  const Icon = dir === 'prev' ? ChevronLeft : ChevronRight;
  return (
    <Link
      href={href(f)}
      aria-label={dir === 'prev' ? 'Perfume anterior' : 'Perfume siguiente'}
      className={cn(
        'fixed bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 grid size-12 place-items-center rounded-full border border-sand/60 bg-cream text-walnut shadow-lg shadow-black/40 transition active:scale-95 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 hover:brightness-95',
        className,
      )}
    >
      <Icon className="size-6" strokeWidth={2.5} />
    </Link>
  );
}
