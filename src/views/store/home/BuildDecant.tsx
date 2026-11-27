'use client';

import { useMemo, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { newestWithImage } from '@/models/domain/catalog';
import { BOTTLE, reservedFor, sizeState } from '@/models/domain/sizes';
import type { Fragrance } from '@/models/types';
import { Button } from '@/views/shared/Button';
import { SmartImage } from '@/views/shared/SmartImage';
import { useStore } from '../state/StoreProvider';
import styles from './HomeSections.module.css';

/** "Arma tu decant": eliges perfume y tamaño, ves el precio y lo agregas a la bolsa. */
export function BuildDecant({ featuredId }: { featuredId?: string }) {
  const { fragrances, sizes, cart, price, addToCart } = useStore();
  const decantSizes = useMemo(() => sizes.filter((s) => s.kind === 'decant').slice(0, 4), [sizes]);

  // El perfume de la portada primero y luego los más nuevos que tengan algún decant disponible.
  const picks = useMemo(() => {
    const ok = (f: Fragrance) => !f.comingSoon && decantSizes.some((s) => sizeState(f, s.key, sizes).ok);
    const featured = fragrances.find((f) => f.id === featuredId);
    const rest = newestWithImage(fragrances, 40).filter((f) => f.id !== featuredId);
    return [featured, ...rest].filter((f): f is (typeof fragrances)[number] => !!f && !!f.image && ok(f as Fragrance)).slice(0, 5);
  }, [fragrances, featuredId, decantSizes, sizes]);

  const [sel, setSel] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const f = picks[sel] as Fragrance | undefined;
  if (!f || !decantSizes.length) return null;

  const reserved = reservedFor(cart, f, sizes);
  const states = decantSizes.map((s) => ({ s, st: sizeState(f, s.key, sizes, reserved) }));
  const current = states.find((x) => x.s.key === size && x.st.ok) ?? states.find((x) => x.s.key === decantSizes[1]?.key && x.st.ok) ?? states.find((x) => x.st.ok);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-[11px] uppercase tracking-[0.2em] text-ember">Hazlo a tu medida</p>
      <h2 className="mt-2 text-[clamp(2rem,9vw,3.2rem)] leading-none">Arma tu decant.</h2>
      <div className={cn(styles.glass, 'mt-5 rounded-3xl p-4 sm:p-6')}>
        <div className="grid grid-cols-[100px_1fr] items-center gap-4 sm:grid-cols-[160px_1fr]">
          <div className={cn(styles.halo, 'relative h-36 sm:h-48')}>
            <SmartImage key={f.id} src={f.image!} alt={`${f.brand} ${f.name}`} fill sizes="160px" className={cn(styles.pop, 'object-contain')} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.14em] text-sand">1. Elige tu perfume</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {picks.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={i === sel}
                  onClick={() => setSel(i)}
                  className={cn('rounded-pill border px-3 py-1.5 text-[11px]', i === sel ? 'btn-primary border-transparent bg-cream text-walnut' : 'border-cork text-sand hover:text-cream')}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-sand">2. Elige el tamaño</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {states.map(({ s, st }) => (
                <button
                  key={s.key}
                  type="button"
                  disabled={!st.ok}
                  aria-pressed={current?.s.key === s.key}
                  onClick={() => setSize(s.key)}
                  className={cn(
                    'rounded-pill border px-3 py-1.5 text-xs disabled:opacity-35',
                    current?.s.key === s.key ? 'border-ember bg-ember/15 text-cream' : 'border-cork text-sand hover:text-cream',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="font-mono text-3xl font-semibold">{current ? price(current.st.price) : '—'}</span>
          <Button variant="primary" size="md" disabled={!current} onClick={() => current && addToCart(f.id, current.s.key === BOTTLE ? BOTTLE : current.s.key)}>
            <ShoppingBag className="size-4" /> Agregar a la bolsa
          </Button>
        </div>
      </div>
    </section>
  );
}
