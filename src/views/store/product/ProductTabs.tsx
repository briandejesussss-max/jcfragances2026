'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export interface ProductTab {
  id: string;
  label: string;
  content: ReactNode;
}

/**
 * Pestañas de la ficha (Notas · Radiografía · Reseñas): se ve una a la vez para que la
 * página no sea tan larga. Los enlaces #veredicto / #resenas abren su pestaña.
 * Todo el contenido queda en la página (oculto), así Google lo sigue leyendo.
 */
export function ProductTabs({ tabs }: { tabs: ProductTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const open = (scroll: boolean) => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!tabs.some((t) => t.id === id)) return;
      setActive(id);
      if (scroll) requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    };
    open(true);
    const onHash = () => open(true);
    // Clic en un enlace #resenas aunque el hash ya sea el mismo
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      const id = a?.getAttribute('href')?.slice(1);
      if (!id || !tabs.some((t) => t.id === id)) return;
      e.preventDefault();
      history.replaceState(null, '', `#${id}`);
      setActive(id);
      requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    };
    window.addEventListener('hashchange', onHash);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('hashchange', onHash);
      document.removeEventListener('click', onClick);
    };
  }, [tabs]);

  return (
    <div ref={ref} className="scroll-mt-20">
      <div role="tablist" aria-label="Información del perfume" className="mb-3 flex gap-1 rounded-pill border border-cork bg-umber p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setActive(t.id)}
            className={cn(
              'flex-1 rounded-pill px-2 py-2 text-[11px] uppercase tracking-[0.06em] transition',
              active === t.id ? 'bg-cream text-walnut' : 'text-sand hover:text-cream',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={active !== t.id}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
