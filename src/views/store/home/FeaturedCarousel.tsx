'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { fragranceSlug } from '@/lib/utils/slug';
import { minSizePrice, sizeState } from '@/models/domain/sizes';
import type { Fragrance } from '@/models/types';
import { buttonClass } from '@/views/shared/Button';
import { SmartImage } from '@/views/shared/SmartImage';
import { useStore } from '../state/StoreProvider';
import styles from './FeaturedCarousel.module.css';

const DURATION = 4500;
const TINTS = ['var(--color-ember)', '#9b5dff', '#ff8a1e', '#3ec7ff', '#3ecf8e', '#ff4f9a'];

/** Notas para los chips: las primeras del texto de notas (con su emoji si lo trae). */
const notesOf = (text: string | undefined) =>
  (text ?? '')
    .split(/[,\n]|\.\s/)
    .map((t) => t.replace(/\.$/, '').trim())
    .filter((t) => t && t.length < 26)
    .slice(0, 4);

/**
 * Portada: carrusel de perfumes destacados (se eligen en Panel → Tienda → Portada).
 * Pasa solo cada 4.5 s con barritas tipo historias, se desliza con el dedo y se pausa al tocarlo.
 * Con "reducir movimiento" no avanza solo.
 */
export function FeaturedCarousel({ ids }: { ids: string[] }) {
  const { byId, sizes, price, addToCart } = useStore();
  const list = ids.map((id) => byId.get(id)).filter((f): f is NonNullable<typeof f> => !!f);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [hidden, setHidden] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMq = () => setReduced(mq.matches);
    const onVis = () => setHidden(document.hidden);
    onMq();
    mq.addEventListener('change', onMq);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      mq.removeEventListener('change', onMq);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const auto = !paused && !reduced && !hidden && list.length > 1;
  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => setI((x) => (x + 1) % list.length), DURATION);
    return () => clearTimeout(t);
  }, [i, auto, list.length]);

  if (!list.length) return null;
  const idx = i % list.length;
  const f = list[idx] as Fragrance;
  const decants = sizes.filter((s) => s.kind === 'decant');
  const from = minSizePrice(decants, f);
  const firstOk = decants.find((s) => sizeState(f, s.key, sizes).ok && !sizeState(f, s.key, sizes).onDemand) ?? decants.find((s) => sizeState(f, s.key, sizes).ok);
  const go = (d: number) => setI((x) => (x + d + list.length) % list.length);

  return (
    <section
      className="mx-auto max-w-6xl px-4 pb-4 pt-4 sm:pt-6"
      aria-roledescription="carrusel"
      aria-label="Perfumes destacados"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (touchX.current ?? e.changedTouches[0].clientX);
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
        setPaused(false);
      }}
      data-no-swipe
    >
      {/* Barritas: una por perfume; la actual se va llenando */}
      {list.length > 1 && (
        <div className="mb-3 flex gap-1.5">
          {list.map((x, k) => (
            <button key={x.id} type="button" onClick={() => setI(k)} className="h-1 flex-1 overflow-hidden rounded-full bg-cream/15" aria-label={`Ver ${x.brand} ${x.name}`} aria-current={k === idx}>
              <span
                key={`${idx}-${auto}`}
                className={`${styles.bar} ${k === idx && auto ? styles.barActive : ''}`}
                style={{ width: k <= idx ? '100%' : '0%', animationDuration: `${DURATION}ms` }}
              />
            </button>
          ))}
        </div>
      )}

      <div key={f.id} className={styles.slide} style={{ ['--tint' as string]: TINTS[idx % TINTS.length] }} aria-live={auto ? 'off' : 'polite'}>
        <div className={`${styles.text} relative z-10 order-2 sm:order-1`}>
          <p className="text-[10px] uppercase tracking-[0.2em] text-ember">
            ✦ Destacado {idx + 1}/{list.length}
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.14em] text-sand">{f.brand}</p>
          <h1 className="text-[clamp(2rem,9vw,3.6rem)] leading-[0.95]">{f.name}</h1>
          {notesOf(f.notes).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {notesOf(f.notes).map((n) => (
                <span key={n} className="rounded-pill border border-cream/15 bg-walnut/50 px-2.5 py-1 text-[11px] text-sand">
                  {n}
                </span>
              ))}
            </div>
          )}
          {from > 0 && (
            <p className="mt-4 text-sm text-sand">
              Decants desde <strong className="font-mono text-2xl text-cream">{price(from)}</strong>
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {firstOk && (
              <button type="button" onClick={() => addToCart(f.id, firstOk.key)} className={buttonClass('primary', 'md')}>
                <ShoppingBag className="size-4" /> Agregar {firstOk.label}
              </button>
            )}
            <Link href={`/perfume/${fragranceSlug(f)}`} className={buttonClass('ghost', 'md')}>
              Ver más
            </Link>
          </div>
        </div>
        <Link href={`/perfume/${fragranceSlug(f)}`} className={`${styles.bottle} relative order-1 mx-auto block h-[30svh] w-full max-w-xs sm:order-2 sm:h-[48svh]`} tabIndex={-1} aria-hidden="true">
          <SmartImage src={f.image!} alt="" fill priority={idx === 0} sizes="(max-width: 640px) 80vw, 40vw" className="object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,.55)]" />
        </Link>
      </div>
      {list.length > 1 && <p className="mt-2 text-center text-[11px] text-drift">Desliza para ver más perfumes</p>}
    </section>
  );
}
