'use client';

import { useState } from 'react';
import { Download, MessageCircle, Share2 } from 'lucide-react';
import type { Fragrance } from '@/models/types';
import { Button, buttonClass } from '@/views/shared/Button';
import { useToast } from '@/views/shared/Toast';
import { SizeButtons } from '../catalog/SizeButtons';
import { useStore } from '../state/StoreProvider';
import { fragranceAdviceLink } from '../whatsapp-messages';
import { renderFichaImage, shareOrDownloadFicha } from './ficha-image';

/** Formatos y compra, asesoría por WhatsApp, ficha descargable y enlace para compartir. */
export function ProductPurchase({ fragrance: f }: { fragrance: Fragrance }) {
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
    const url = window.location.href.split('?')[0];
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
    <section id="precios" className="scroll-mt-20 space-y-3 rounded-3xl border border-cork bg-umber p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[11px] tracking-[0.14em] text-sand">Formatos en decants & botella</h2>
        <span className="text-[10px] uppercase text-drift">Atomizadores de vidrio</span>
      </div>
      <SizeButtons fragrance={f} large />
      <a href={fragranceAdviceLink(config, f)} target="_blank" rel="noopener noreferrer" className={buttonClass('whatsapp', 'md', 'w-full')}>
        <MessageCircle className="size-4" /> Pedir asesoría directa por WhatsApp
      </a>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="ghost" size="sm" onClick={download} disabled={busy}>
          <Download className="size-3.5" /> {busy ? 'Generando…' : 'Descargar ficha'}
        </Button>
        <Button variant="ghost" size="sm" onClick={share}>
          <Share2 className="size-3.5" /> Compartir link
        </Button>
      </div>
    </section>
  );
}
