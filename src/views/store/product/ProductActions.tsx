'use client';

import { useState } from 'react';
import { Download, LoaderCircle, MessageCircle, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Fragrance } from '@/models/types';
import { useToast } from '@/views/shared/Toast';
import { useStore } from '../state/StoreProvider';
import { fragranceAdviceLink } from '../whatsapp-messages';
import { renderFichaImage, shareOrDownloadFicha } from './ficha-image';

/**
 * Botones redondos sobre la foto: asesoría por WhatsApp, descargar ficha y compartir link.
 * Son de "vidrio esmerilado" (fondo semitransparente con desenfoque y sombra),
 * así se leen bien sobre cualquier foto, clara u oscura.
 */
export function ProductActions({ fragrance: f }: { fragrance: Fragrance }) {
  const { config, sizes, price } = useStore();
  const notify = useToast();
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    notify('Creando ficha visual...', 2500);
    try {
      const blob = await renderFichaImage(f, config, sizes, (n) => price(n));
      const r = await shareOrDownloadFicha(blob, f);
      if (r !== 'cancelled') notify(r === 'shared' ? '¡Ficha lista! 📸' : '¡Ficha descargada en imagen! 📸', 3000);
    } catch {
      notify('No se pudo generar la imagen. Intenta de nuevo.', 3500);
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    const url = window.location.href.split('?')[0].split('#')[0];
    const title = `${f.brand} ${f.name} | ${config.name}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `Mira ${f.brand} ${f.name} en ${config.name}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      notify('Link copiado ✓ pégalo donde quieras');
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') notify('No se pudo compartir el link');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <a href={fragranceAdviceLink(config, f)} target="_blank" rel="noopener noreferrer" aria-label="Pedir asesoría por WhatsApp" title="Asesoría por WhatsApp" className={cn(glass, 'text-[#25D366]')}>
        <MessageCircle className="size-[18px]" strokeWidth={2.2} />
      </a>
      <button type="button" onClick={download} disabled={busy} aria-label="Descargar ficha en imagen" title="Descargar ficha" className={glass}>
        {busy ? <LoaderCircle className="size-[18px] animate-spin" /> : <Download className="size-[18px]" strokeWidth={2.2} />}
      </button>
      <button type="button" onClick={share} aria-label="Compartir link del perfume" title="Compartir link" className={glass}>
        <Share2 className="size-[18px]" strokeWidth={2.2} />
      </button>
    </div>
  );
}

const glass =
  'grid size-10 place-items-center rounded-full border border-white/25 bg-black/35 text-white shadow-[0_4px_14px_rgb(0_0_0/0.35)] backdrop-blur-md transition hover:bg-black/50 active:scale-95 disabled:opacity-60';
