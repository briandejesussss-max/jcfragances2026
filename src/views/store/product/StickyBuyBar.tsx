'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { presentationLabel, reservedFor, sizeState } from '@/models/domain/sizes';
import type { Fragrance } from '@/models/types';
import { SmartImage } from '@/views/shared/SmartImage';
import { useStore } from '../state/StoreProvider';
import styles from './StickyBuyBar.module.css';

/**
 * Celular: cuando los precios quedan arriba de la pantalla, aparece una barra fija
 * (sobre las pestañas) para agregar sin tener que regresar.
 */
export function StickyBuyBar({ fragrance: f }: { fragrance: Fragrance }) {
  const { sizes, cart, price, addToCart } = useStore();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const target = document.getElementById('precios-opciones');
    if (!target) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(target);
    return () => io.disconnect();
  }, []);

  if (f.comingSoon) return null;
  const reserved = reservedFor(cart, f, sizes);
  const first = sizes
    .filter((s) => s.kind === 'decant')
    .map((s) => ({ key: s.key, st: sizeState(f, s.key, sizes, reserved) }))
    .find((x) => x.st.ok && !x.st.noPrice && !x.st.onDemand);

  return (
    <div className={cn(styles.bar, show && styles.on)} aria-hidden={!show} data-no-swipe data-buybar={show ? 'on' : 'off'}>
      <div className="mx-auto flex max-w-xl items-center gap-3">
        {f.image && (
          <span className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-walnut">
            <SmartImage src={f.image} alt="" fill sizes="44px" className="object-contain p-1" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-cream">{f.name}</span>
          <span className="block truncate text-xs text-sand">{f.brand}</span>
        </span>
        {first ? (
          <button type="button" tabIndex={show ? 0 : -1} onClick={() => addToCart(f.id, first.key)} className="btn-primary inline-flex shrink-0 items-center gap-1.5 rounded-pill bg-bark px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.04em] text-cream">
            <ShoppingBag className="size-4" aria-hidden="true" />
            {presentationLabel(sizes, f, first.key)} · {price(first.st.price)}
          </button>
        ) : (
          <a href="#precios" tabIndex={show ? 0 : -1} className="btn-primary shrink-0 rounded-pill bg-bark px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.04em] text-cream">
            Ver opciones
          </a>
        )}
      </div>
    </div>
  );
}
