'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { PyramidSection } from '@/models/types';
import { buttonClass } from '@/views/shared/Button';
import { SmartImage } from '@/views/shared/SmartImage';
import styles from './FeatureHero.module.css';

export interface FeatureNote {
  section: PyramidSection;
  text: string;
  img: string;
  emoji: string;
}

export interface FeatureHeroProps {
  brand: string;
  name: string;
  image: string;
  href: string;
  capPct: number;
  notes: FeatureNote[];
}

const SECTION_LABEL: Record<PyramidSection, string> = { top: 'Salida', mid: 'Corazón', base: 'Fondo' };
const BOTTLE_W = 200;
const BOTTLE_H = 300;

const clamp = (n: number) => Math.min(1, Math.max(0, n));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Avance 0 → 1 mientras la sección "pegada" recorre la pantalla (solo calcula cuando hay scroll). */
function useScrollProgress(enabled: boolean) {
  const ref = useRef<HTMLElement>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const range = r.height - window.innerHeight;
      setP(range > 0 ? clamp(-r.top / range) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled]);
  return [ref, p] as const;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/**
 * Portada con "desglose": al bajar, el perfume entra deslizándose, se le quita la tapa
 * y de la boquilla salen, como del atomizador, sus notas de salida, corazón y fondo.
 * Con "reducir movimiento" se muestra directamente el resultado final, sin animación.
 */
export function FeatureHero({ brand, name, image, href, capPct, notes }: FeatureHeroProps) {
  const reduced = useReducedMotion();
  const [ref, scrolled] = useScrollProgress(!reduced);
  const p = reduced ? 1 : scrolled;

  const cap = easeInOut(seg(p, 0.06, 0.26));
  const spray = seg(p, 0.26, 0.8);
  const finale = easeOut(seg(p, 0.84, 0.97));
  const neckY = (capPct / 100) * BOTTLE_H;

  // Lugar final de cada nota: a los lados del frasco; salida arriba, corazón en medio, fondo abajo.
  const placed = notes.map((n, i) => {
    const k = notes.filter((m, j) => m.section === n.section && j < i).length;
    const side = k % 2 === 0 ? -1 : 1;
    const row = n.section === 'top' ? -10 : n.section === 'mid' ? 110 : 230;
    return { ...n, x: side * 145, y: row, delay: i * 0.08 };
  });

  const stage = finale > 0.05 ? 3 : spray > 0.05 ? 2 : cap > 0.05 ? 1 : 0;
  const titles = ['Lleva el perfume que quieres, en la medida que quieres.', 'Destápalo…', 'Así huele por dentro.', 'Pruébalo en decant antes de comprar la botella.'];
  const showButtons = p < 0.05 || finale > 0;

  return (
    <section ref={ref} className={styles.section} style={{ height: reduced ? '100svh' : '340svh' }} aria-label={`${brand} ${name}: sus notas olfativas`}>
      <div className={styles.sticky}>
        <div className={styles.glow} style={{ opacity: 0.55 + spray * 0.45 }} aria-hidden="true" />

        <div className="absolute inset-x-4 top-20 z-10 mx-auto max-w-6xl sm:top-24">
          <p className="text-[10px] uppercase tracking-[0.2em] text-ember">✦ {stage >= 2 ? `${brand} · ${name}` : 'Decants originales · Envíos a todo México'}</p>
          <h1 key={stage} className={`${styles.title} ${stage > 0 ? 'text-aurora text-ember' : ''}`}>
            {titles[stage]}
          </h1>
        </div>

        {/* Frasco: la misma foto recortada en dos (tapa y cuerpo) */}
        <div
          className={styles.bottle}
          style={{
            width: BOTTLE_W,
            height: BOTTLE_H,
            transform: 'translate(-50%, -40%)',
          }}
        >
          <div className={styles.layer} style={{ clipPath: `inset(${capPct}% 0 0 0)` }}>
            <SmartImage src={image} alt={`${brand} ${name}`} fill priority sizes="200px" className="object-contain" />
          </div>
          <div
            className={styles.layer}
            style={{ clipPath: `inset(0 0 ${100 - capPct}% 0)`, transform: `translate(${cap * 70}px, ${-cap * 175}px) rotate(${cap * 24}deg)`, opacity: 1 - finale * 0.4 }}
            aria-hidden="true"
          >
            <SmartImage src={image} alt="" fill sizes="200px" className="object-contain" />
          </div>

          {/* Rocío que sale de la boquilla */}
          {!reduced &&
            Array.from({ length: 16 }).map((_, i) => {
              const t = clamp(spray * 1.6 - (i % 8) * 0.07);
              const ang = (i / 16) * Math.PI - Math.PI;
              const dist = t * (90 + (i % 5) * 28);
              const size = 10 + (i % 4) * 6;
              return (
                <span
                  key={i}
                  className={styles.mist}
                  data-tone={i % 3}
                  style={{ top: neckY, width: size, height: size, opacity: t > 0 && t < 1 ? 0.75 * (1 - t) : 0, transform: `translate(${Math.cos(ang) * dist - size / 2}px, ${Math.sin(ang) * dist - size / 2}px)` }}
                  aria-hidden="true"
                />
              );
            })}

          {/* Notas: salen de la boquilla y se acomodan alrededor */}
          {placed.map((n, i) => {
            const t = easeOut(clamp((spray - n.delay) / 0.45));
            const cx = n.x * t;
            const cy = neckY + (n.y - neckY) * t - Math.sin(t * Math.PI) * 60;
            return (
              <div
                key={`${n.text}-${i}`}
                className={`${styles.note} ${t >= 1 ? styles.bob : ''}`}
                style={{ transform: `translate(calc(-50% + ${cx}px), calc(-50% + ${cy}px)) scale(${0.2 + t * 0.8})`, opacity: t }}
              >
                <div className={styles.noteImg}>
                  <span aria-hidden="true">{n.emoji}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element -- fotos de notas: externas o data URI */}
                  {n.img && <img src={n.img} alt="" loading="lazy" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                </div>
                <span className="text-[8px] uppercase tracking-[0.14em] text-ember">{SECTION_LABEL[n.section]}</span>
                <span className="whitespace-nowrap text-[11px] font-semibold">{n.text}</span>
              </div>
            );
          })}
        </div>

        <div
          className="absolute inset-x-4 bottom-16 z-10 mx-auto flex max-w-6xl flex-wrap gap-3 transition-opacity"
          style={{ opacity: showButtons ? 1 : 0, pointerEvents: showButtons ? 'auto' : 'none' }}
        >
          <Link href="#catalogo" className={buttonClass('primary', 'lg')}>
            Ver catálogo
          </Link>
          <Link href={href} className={buttonClass('ghost', 'lg')}>
            Ver {name}
          </Link>
        </div>

        {!reduced && (
          <>
            <div className={styles.progress} aria-hidden="true">
              <span style={{ width: `${p * 100}%` }} />
            </div>
            {p < 0.03 && <p className="absolute inset-x-0 bottom-32 text-center text-[11px] text-drift">↓ Desliza para descubrirlo</p>}
          </>
        )}
      </div>
    </section>
  );
}
