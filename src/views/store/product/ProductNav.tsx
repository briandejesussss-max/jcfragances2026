'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
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

/** ¿El dedo empezó sobre algo que ya se desplaza de lado (carrusel de notas) o un campo de texto? */
function blocksSwipe(el: Element | null): boolean {
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    if (n.matches('input, textarea, select, [role="dialog"], [data-no-swipe]')) return true;
    const ox = getComputedStyle(n).overflowX;
    if ((ox === 'auto' || ox === 'scroll') && n.scrollWidth > n.clientWidth + 2) return true;
  }
  return false;
}

/**
 * Deslizar el dedo a los lados en cualquier parte de la ficha cambia de perfume:
 * hacia la izquierda = siguiente, hacia la derecha = anterior. En computadora, teclas ← →.
 * No dibuja nada en pantalla.
 */
export function ProductSwipeNav({ id }: { id: string }) {
  const n = useNeighbors(id);
  const router = useRouter();
  const { cartOpen, menuOpen } = useStore();
  const start = useRef<{ x: number; y: number; t: number } | null>(null);

  useEffect(() => {
    if (!n) return;
    const go = (dir: 'prev' | 'next') => router.push(href(n[dir]));
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (cartOpen || menuOpen || e.altKey || e.ctrlKey || e.metaKey || t?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key === 'ArrowLeft') go('prev');
      if (e.key === 'ArrowRight') go('next');
    };
    const onStart = (e: TouchEvent) => {
      start.current = e.touches.length === 1 && !cartOpen && !menuOpen && !blocksSwipe(e.target as Element) ? { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() } : null;
    };
    const onEnd = (e: TouchEvent) => {
      const s = start.current;
      start.current = null;
      if (!s || Date.now() - s.t > 800) return;
      const dx = e.changedTouches[0].clientX - s.x;
      const dy = e.changedTouches[0].clientY - s.y;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) go(dx < 0 ? 'next' : 'prev');
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchend', onEnd);
    };
  }, [n, router, cartOpen, menuOpen]);

  return null;
}
