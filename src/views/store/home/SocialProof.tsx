'use client';

import { Star, Truck } from 'lucide-react';
import { useStore } from '../state/StoreProvider';

/** Franja de confianza con las reseñas reales de clientes (se oculta si aún no hay). */
export function SocialProof() {
  const { reviewStats } = useStore();
  const stats = Object.values(reviewStats);
  const count = stats.reduce((a, s) => a + s.reviews, 0);
  if (!count) return null;
  const avg = stats.reduce((a, s) => a + s.average * s.reviews, 0) / count;
  return (
    <div className="mx-auto max-w-6xl px-4 pt-2">
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 rounded-2xl border border-cork bg-umber/70 px-4 py-3 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="flex text-ember" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="size-3.5 fill-current" />
            ))}
          </span>
          <strong>{avg.toFixed(1)}</strong>
          <span className="text-sand">
            · {count} {count === 1 ? 'reseña' : 'reseñas'} de clientes
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-sand">
          <Truck className="size-4 text-ember" aria-hidden="true" /> Envíos a todo México
        </span>
      </div>
    </div>
  );
}
