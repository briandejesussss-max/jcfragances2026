'use client';

import { Truck } from 'lucide-react';
import { useStore } from '../state/StoreProvider';

/** "Te faltan $X para envío gratis" con barra de avance (solo si el envío gratis está activado). */
export function FreeShippingMeter({ subtotal, freeFrom }: { subtotal: number; freeFrom: number }) {
  const { price } = useStore();
  const missing = Math.max(0, freeFrom - subtotal);
  const pct = Math.min(100, Math.round((subtotal / freeFrom) * 100));
  return (
    <div className="rounded-2xl border border-cork bg-walnut/50 p-3" role="status">
      <p className="flex items-center gap-2 text-sm">
        <Truck className="size-4 shrink-0 text-ember" aria-hidden="true" />
        {missing > 0 ? (
          <span>
            Te faltan <strong>{price(missing)}</strong> para el <strong>envío gratis</strong>
          </span>
        ) : (
          <span>
            ¡Listo! Tu envío es <strong className="text-ok">gratis</strong>
          </span>
        )}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cork" aria-hidden="true">
        <div className="h-full rounded-full bg-ember transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
