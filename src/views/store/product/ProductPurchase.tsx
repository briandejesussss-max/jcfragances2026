import type { Fragrance } from '@/models/types';
import { SizeButtons } from '../catalog/SizeButtons';
import { PurchaseInfo } from './PurchaseInfo';

/** Formatos y compra (WhatsApp, descargar y compartir están arriba, sobre la foto). */
export function ProductPurchase({ fragrance: f }: { fragrance: Fragrance }) {
  return (
    <section id="precios" className="scroll-mt-20 space-y-3 rounded-3xl border border-cork bg-umber p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[11px] tracking-[0.14em] text-sand">Formatos en decants & botella</h2>
        <span className="text-[11px] uppercase text-drift">Atomizadores de vidrio</span>
      </div>
      <div id="precios-opciones">
        <SizeButtons fragrance={f} large />
      </div>
      <PurchaseInfo />
    </section>
  );
}
