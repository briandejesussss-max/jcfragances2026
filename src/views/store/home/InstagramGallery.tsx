'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { SmartImage } from '@/views/shared/SmartImage';
import styles from './HomeSections.module.css';

export interface GalleryPhoto {
  image: string;
  link?: string;
  caption?: string;
  /** Perfume de referencia (para el botón "Ver perfume"). */
  fragrance?: { name: string; brand: string; href: string };
}

/** Ícono tipo Instagram (cámara redondeada). */
function IgIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

/**
 * "Síguenos en Instagram": una fila de tarjetas tipo historias que se desliza de lado
 * (ocupa poco). Al tocar una se abre en grande; se pasa a la siguiente deslizando o con
 * las flechas, y si tiene perfume de referencia aparece "Ver perfume".
 * Las fotos, textos y referencias se editan en Panel → Tienda → Portada.
 */
export function InstagramGallery({ photos, handle, url }: { photos: GalleryPhoto[]; handle: string; url: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!photos.length) return null;
  const user = handle.replace(/^@/, '') || 'instagram';
  const profile = url || `https://www.instagram.com/${user}`;

  return (
    <section className="mx-auto max-w-6xl py-10">
      <div className="flex items-center justify-between gap-3 px-4">
        <a href={profile} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-3">
          <span className={styles.igRing}>
            <span>
              <IgIcon className="size-5 text-cream" />
            </span>
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] uppercase tracking-[0.2em] text-ember">Síguenos en Instagram</span>
            <span className="block truncate text-xl font-extrabold">@{user}</span>
          </span>
        </a>
        <a href={profile} target="_blank" rel="noopener noreferrer" className="btn-primary shrink-0 rounded-pill bg-bark px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-cream">
          Seguir
        </a>
      </div>

      <div className="flex snap-x gap-3 overflow-x-auto px-4 pb-2 pt-4 [scrollbar-width:none]">
        {photos.map((p, i) => (
          <button key={`${p.image}-${i}`} type="button" onClick={() => setOpen(i)} className={styles.story} aria-label={`Abrir foto ${i + 1}${p.caption ? `: ${p.caption}` : ''}`}>
            <SmartImage src={p.image} alt="" fill sizes="(max-width: 640px) 42vw, 220px" className="object-cover transition duration-500 group-hover:scale-105" />
            <span className={styles.storyShade} aria-hidden="true" />
            <IgIcon className="absolute right-2 top-2 size-4 text-white drop-shadow" />
            {(p.caption || p.fragrance) && (
              <span className="absolute inset-x-2.5 bottom-2.5 text-left">
                {p.fragrance && <span className="mb-1 inline-block max-w-full truncate rounded-pill bg-black/45 px-2 py-0.5 text-[10px] text-white backdrop-blur">✦ {p.fragrance.name}</span>}
                {p.caption && <span className="line-clamp-2 block text-xs font-semibold leading-snug text-white">{p.caption}</span>}
              </span>
            )}
          </button>
        ))}
      </div>

      {open !== null && <Viewer photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} profile={profile} />}
    </section>
  );
}

/** Foto en grande: deslizar o flechas para cambiar, Esc o ✕ para cerrar. */
function Viewer({ photos, index, onIndex, onClose, profile }: { photos: GalleryPhoto[]; index: number; onIndex: (i: number) => void; onClose: () => void; profile: string }) {
  const p = photos[index];
  const start = useRef<number | null>(null);
  const go = useCallback((d: number) => onIndex((index + d + photos.length) % photos.length), [index, onIndex, photos.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [go, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Foto de Instagram"
      className="fixed inset-0 z-[60] flex flex-col bg-black/90 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      onTouchStart={(e) => (start.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (start.current === null) return;
        const dx = e.changedTouches[0].clientX - start.current;
        start.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      {/* Barritas de progreso como en las historias */}
      <div className="flex gap-1 px-3 pt-3" aria-hidden="true">
        {photos.map((_, i) => (
          <span key={i} className={cn('h-0.5 flex-1 rounded-full', i <= index ? 'bg-white' : 'bg-white/25')} />
        ))}
      </div>
      <div className="flex items-center justify-between px-3 py-2 text-white">
        <span className="text-xs text-white/70">
          {index + 1} / {photos.length}
        </span>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="grid size-10 place-items-center rounded-full hover:bg-white/10">
          <X className="size-6" />
        </button>
      </div>

      <div className="relative mx-auto w-full max-w-md flex-1" onClick={(e) => e.stopPropagation()}>
        <SmartImage key={p.image} src={p.image} alt={p.caption || 'Foto de Instagram'} fill sizes="(max-width: 640px) 100vw, 448px" className="object-contain animate-fade-in" />
        {photos.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Foto anterior" className="absolute left-1 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white sm:grid">
              <ChevronLeft className="size-6" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Foto siguiente" className="absolute right-1 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white sm:grid">
              <ChevronRight className="size-6" />
            </button>
          </>
        )}
      </div>

      <div className="mx-auto w-full max-w-md space-y-3 px-4 pb-6 pt-3 text-white" onClick={(e) => e.stopPropagation()}>
        {p.caption && <p className="text-sm leading-relaxed">{p.caption}</p>}
        <div className="flex flex-wrap gap-2">
          {p.fragrance && (
            <Link href={p.fragrance.href} onClick={onClose} className="btn-primary rounded-pill bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.06em] text-black">
              Ver {p.fragrance.name} →
            </Link>
          )}
          <a href={p.link || profile} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-pill border border-white/60 px-4 py-2.5 text-xs uppercase tracking-[0.06em]">
            <IgIcon className="size-4" /> Ver en Instagram
          </a>
        </div>
      </div>
    </div>
  );
}
