'use client';

import { useEffect, useRef, useState } from 'react';
import { Palette } from 'lucide-react';
import { PALETTES, PALETTE_STORAGE_KEY, type PaletteKey } from '@/config/palettes';
import { cn } from '@/lib/utils/cn';

function applyPalette(key: PaletteKey) {
  const html = document.documentElement;
  if (key === 'aurora') html.removeAttribute('data-palette');
  else html.setAttribute('data-palette', key);
  try {
    localStorage.setItem(PALETTE_STORAGE_KEY, key);
  } catch {
    // sin almacenamiento: la paleta dura solo esta visita
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute('content', PALETTES.find((p) => p.key === key)?.swatch ?? '#000000');
}

/** Selector de paleta de colores (se recuerda en este dispositivo). */
export function PaletteSwitcher({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<PaletteKey>('aurora');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lee la paleta aplicada antes de hidratar
    setCurrent((document.documentElement.getAttribute('data-palette') as PaletteKey) || 'aurora');
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Cambiar colores"
        aria-expanded={open}
        className="rounded-full p-2 text-cream hover:bg-bark"
      >
        <Palette className="size-5" />
      </button>
      {open && (
        <div role="menu" className="animate-fade-in absolute right-0 top-11 z-50 flex min-w-48 flex-col gap-1.5 rounded-xl border border-dashed border-cork bg-bark p-2.5">
          {PALETTES.map((p) => (
            <button
              key={p.key}
              type="button"
              role="menuitemradio"
              aria-checked={current === p.key}
              onClick={() => {
                applyPalette(p.key);
                setCurrent(p.key);
                setOpen(false);
              }}
              className={cn(
                'flex items-center gap-2.5 rounded-pill border px-3 py-1.5 text-left text-[11px] uppercase tracking-[0.04em] text-cream',
                current === p.key ? 'border-cream' : 'border-cork',
              )}
            >
              <i className="inline-block size-4 rounded-full border border-cork" style={{ background: p.swatch }} />
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
