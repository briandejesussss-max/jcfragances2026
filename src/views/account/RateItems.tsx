'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, Star } from 'lucide-react';
import { fragranceSlug } from '@/lib/utils/slug';
import type { MyReview, OrderItem } from '@/models/types';
import { Button } from '@/views/shared/Button';
import { ReviewForm } from '@/views/reviews/ReviewForm';
import { Stars } from '@/views/reviews/Stars';

/** "Califica tus perfumes" en un pedido entregado: un renglón por perfume distinto. */
export function RateItems({ items, reviews }: { items: OrderItem[]; reviews: MyReview[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const perfumes = [...new Map(items.map((i) => [i.fragId, i])).values()];
  const byId = new Map(reviews.map((r) => [r.fragranceId, r]));

  return (
    <section className="space-y-3 rounded-3xl border border-ember/40 bg-umber p-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.1em] text-ember">Tu opinión ayuda a otros clientes</p>
        <h2 className="mt-1 text-lg">Califica tus perfumes</h2>
      </div>
      {perfumes.map((i) => {
        const mine = byId.get(i.fragId);
        return (
          <div key={i.fragId} className="space-y-2 border-t border-dashed border-cork pt-3 first:border-0 first:pt-0">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="block text-[10px] uppercase tracking-[0.08em] text-sand">{i.brand}</span>
                <Link href={`/perfume/${fragranceSlug(i)}`} className="block truncate text-sm hover:text-ember">
                  {i.name}
                </Link>
                {mine && (
                  <span className="mt-0.5 flex items-center gap-2 text-[11px] text-sand">
                    <Stars value={mine.rating} size="xs" /> {mine.hidden ? 'Oculta por la tienda' : mine.pending ? 'En revisión' : 'Publicada'}
                  </span>
                )}
              </div>
              {editing !== i.fragId &&
                (mine ? (
                  <Button size="sm" variant="ghost" onClick={() => setEditing(i.fragId)}>
                    <Pencil className="size-3.5" /> Editar
                  </Button>
                ) : (
                  <Button size="sm" variant="cream" onClick={() => setEditing(i.fragId)}>
                    <Star className="size-3.5" /> Calificar
                  </Button>
                ))}
            </div>
            {editing === i.fragId && <ReviewForm fragranceId={i.fragId} initial={mine} onDone={() => setEditing(null)} onCancel={() => setEditing(null)} />}
          </div>
        );
      })}
    </section>
  );
}
