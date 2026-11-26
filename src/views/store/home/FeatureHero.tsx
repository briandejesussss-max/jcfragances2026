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
/** Anillos de la órbita: fondo pegado al frasco, corazón en medio, salida afuera (radio y velocidad). */
const RINGS: Record<PyramidSection, { r: number }> = { base: { r: 100 }, mid: { r: 138 }, top: { r: 172 } };
/** Vueltas por segundo (en radianes) y cuánto baja el centro de la órbita respecto al centro del frasco. */
const ORBIT_SPEED = 0.32;
const ORBIT_DROP = 30;
const SPARK_COLORS = ['#ff8a1e', 'var(--color-ember)', '#9b5dff', '#ffffff'];

const clamp = (n: number) => Math.min(1, Math.max(0, n));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
/** Sube y se pasa un poquito (rebote) antes de quedarse. */
const backOut = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

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

/** Avance 0 → 1 mientras la sección "pegada" recorre la pantalla, y si está visible. */
function useScrollProgress(enabled: boolean) {
  const ref = useRef<HTMLElement>(null);
  const [p, setP] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    if (!enabled) return () => io.disconnect();
    let raf = 0;
    const update = () => {
      raf = 0;
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
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled]);
  return [ref, p, visible] as const;
}

/** Segundos transcurridos (para el giro continuo); solo corre cuando `active`. */
function useClock(active: boolean) {
  const [t, setT] = useState(0);
  const base = useRef(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now() - base.current * 1000;
    const loop = (now: number) => {
      base.current = (now - start) / 1000;
      setT(base.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return t;
}

/**
 * Portada "atomizador con órbita": el perfume está al centro; al bajar, la tapa sale con un
 * rebote, el frasco se "aprieta" como al rociar, sale una nube de brillos y las notas aparecen
 * (de borrosas a nítidas) girando alrededor del frasco en 3 anillos: fondo, corazón y salida.
 * Con "reducir movimiento" se muestra el resultado final quieto.
 */
export function FeatureHero({ brand, name, image, href, capPct, notes }: FeatureHeroProps) {
  const reduced = useReducedMotion();
  const [ref, scrolled, visible] = useScrollProgress(!reduced);
  const p = reduced ? 0.9 : scrolled;

  const capT = seg(p, 0.04, 0.17);
  const cap = backOut(capT);
  const press = reduced ? 0 : Math.sin(seg(p, 0.17, 0.23) * Math.PI);
  const burst = reduced ? 0 : seg(p, 0.2, 0.42);
  const appear = seg(p, 0.26, 0.5);
  const finale = easeOut(seg(p, 0.85, 0.97));
  const clock = useClock(!reduced && visible && appear > 0);

  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const ringScale = wide ? 1.35 : 1;
  const neckY = (capPct / 100) * BOTTLE_H;

  const stage = finale > 0.05 ? 3 : appear > 0.05 ? 2 : capT > 0.05 ? 1 : 0;
  const titles = ['Lleva el perfume que quieres, en la medida que quieres.', 'Destápalo…', 'Así huele por dentro.', 'Pruébalo en decant antes de comprar la botella.'];
  const showButtons = p < 0.04 || finale > 0;

  return (
    <section ref={ref} className={styles.section} style={{ height: reduced ? '100svh' : '320svh' }} aria-label={`${brand} ${name}: sus notas olfativas`}>
      <div className={styles.sticky}>
        <div className={styles.glow} style={{ opacity: 0.55 + burst * 0.45 + appear * 0.2 }} aria-hidden="true" />

        <div className="absolute inset-x-4 top-20 z-10 mx-auto max-w-6xl sm:top-24">
          <p className="text-[10px] uppercase tracking-[0.2em] text-ember">✦ {stage >= 2 ? `${brand} · ${name}` : 'Decants originales · Envíos a todo México'}</p>
          <h1 key={stage} className={`${styles.title} ${stage > 0 ? 'text-aurora text-ember' : ''}`}>
            {titles[stage]}
          </h1>
        </div>

        <div className={styles.bottle} style={{ width: BOTTLE_W, height: BOTTLE_H, transform: 'translate(-50%, -50%)' }}>
          {/* Anillos de la órbita */}
          {(['base', 'mid', 'top'] as const).map((s) => (
            <div
              key={s}
              className={styles.ring}
              style={{ width: RINGS[s].r * 2 * ringScale, height: RINGS[s].r * 0.9 * ringScale, transform: `translate(-50%, calc(-50% + ${ORBIT_DROP}px)) scale(${appear})`, opacity: appear * (1 - finale * 0.5) }}
              aria-hidden="true"
            />
          ))}

          {/* Notas girando: van detrás del frasco cuando pasan "atrás" */}
          {notes.map((n, i) => {
            const ring = RINGS[n.section];
            // Todas giran al mismo ritmo y repartidas parejo: nunca se amontonan.
            const ang = (i / notes.length) * Math.PI * 2 + clock * ORBIT_SPEED + (reduced ? 0.5 : 0);
            const x = Math.cos(ang) * ring.r * ringScale;
            const y = Math.sin(ang) * ring.r * 0.45 * ringScale + ORBIT_DROP;
            const depth = (Math.sin(ang) + 1) / 2; // 0 = atrás, 1 = adelante
            const t = easeOut(clamp(appear * 1.4 - i * 0.07));
            return (
              <div
                key={`${n.text}-${i}`}
                className={styles.note}
                style={{
                  zIndex: depth > 0.5 ? 6 : 1,
                  opacity: t * (0.55 + depth * 0.45),
                  filter: t < 1 ? `blur(${(1 - t) * 10}px)` : undefined,
                  transform: `translate(calc(-50% + ${x * t}px), calc(-50% + ${y * t + (neckY - BOTTLE_H / 2) * (1 - t)}px)) scale(${(0.6 + depth * 0.45) * (0.3 + t * 0.7)})`,
                }}
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

          {/* Cuerpo del frasco (se "aprieta" al rociar) */}
          <div className={styles.layer} style={{ zIndex: 3, clipPath: `inset(${capPct}% 0 0 0)`, transform: `scale(${1 - press * 0.04}, ${1 - press * 0.06})`, transformOrigin: '50% 100%' }}>
            <SmartImage src={image} alt={`${brand} ${name}`} fill priority sizes="200px" className="object-contain" />
          </div>
          {/* Tapa: sube con rebote y se queda flotando arriba */}
          <div
            className={styles.layer}
            style={{
              zIndex: 4,
              clipPath: `inset(0 0 ${100 - capPct}% 0)`,
              transform: `translate(${cap * (wide ? 190 : 0)}px, ${-cap * (wide ? 60 : 150)}px) rotate(${cap * (wide ? 14 : -8) + Math.sin(clock * 1.4) * 3 * appear}deg)`,
              opacity: 1 - finale * 0.6,
            }}
            aria-hidden="true"
          >
            <SmartImage src={image} alt="" fill sizes="200px" className="object-contain" />
          </div>

          {/* Nube de brillos que sale de la boquilla */}
          {burst > 0 &&
            burst < 1 &&
            Array.from({ length: 42 }).map((_, i) => {
              const a = -Math.PI / 2 + ((((i * 137.5) % 360) - 180) * Math.PI) / 180 * 0.55;
              const d = easeOut(burst) * (60 + ((i * 53) % 140)) * ringScale;
              const s = 4 + ((i * 7) % 10);
              const c = SPARK_COLORS[i % 4];
              return (
                <span
                  key={i}
                  className={styles.spark}
                  style={{ top: neckY, width: s, height: s, background: c, boxShadow: `0 0 ${s * 2}px ${c}`, opacity: (1 - burst) * 0.9, transform: `translate(${Math.cos(a) * d - s / 2}px, ${Math.sin(a) * d - s / 2}px)` }}
                  aria-hidden="true"
                />
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
