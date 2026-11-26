'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { deleteReviewAction, setReviewHiddenAction } from '@/controllers/review.controller';
import { formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { LONGEVITY_LABEL, SILLAGE_LABEL } from '@/models/domain/reviews';
import type { Review } from '@/models/types';
import { Button } from '@/views/shared/Button';
import { useToast } from '@/views/shared/Toast';
import { Stars } from '@/views/reviews/Stars';
import { PageTitle } from '../shared/PageTitle';

type Filter = 'all' | 'visible' | 'hidden' | 'low';
const FILTERS: Array<[Filter, string]> = [
  ['all', 'Todas'],
  ['visible', 'Publicadas'],
  ['hidden', 'Ocultas'],
  ['low', '1–2 ★'],
];

/** Panel → Reseñas: ver, ocultar/mostrar o borrar reseñas de clientes. */
export function ReviewsModeration({ reviews, names }: { reviews: Review[]; names: Record<string, string> }) {
  const [filter, setFilter] = useState<Filter>('all');
  const shown = reviews.filter((r) => (filter === 'visible' ? !r.hidden : filter === 'hidden' ? r.hidden : filter === 'low' ? r.rating <= 2 : true));
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  return (
    <>
      <PageTitle title="Reseñas">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-pressed={filter === k}
              onClick={() => setFilter(k)}
              className={cn('rounded-pill border px-3 py-1.5 text-[11px] uppercase', filter === k ? 'border-cream bg-cream text-walnut' : 'border-cork text-sand hover:text-cream')}
            >
              {label}
            </button>
          ))}
        </div>
      </PageTitle>
      <p className="mb-4 text-sm text-sand">
        {reviews.length === 0
          ? 'Todavía no hay reseñas. Los clientes con cuenta pueden calificar sus perfumes cuando marques su pedido como “Entregado”.'
          : `${reviews.length} ${reviews.length === 1 ? 'reseña' : 'reseñas'} · promedio ${avg.toFixed(1)} ★. Las ocultas no se ven en la tienda ni cuentan en el promedio.`}
      </p>
      <ul className="space-y-2">
        {shown.map((r) => (
          <ReviewRow key={r.id} review={r} name={names[r.fragranceId] ?? r.fragranceId} />
        ))}
      </ul>
      {reviews.length > 0 && shown.length === 0 && <p className="text-sm text-sand">No hay reseñas con este filtro.</p>}
    </>
  );
}

function ReviewRow({ review: r, name }: { review: Review; name: string }) {
  const router = useRouter();
  const notify = useToast();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done: string) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) return notify(res.error ?? 'No se pudo completar.');
      notify(done);
      router.refresh();
    });

  return (
    <li className={cn('rounded-2xl border border-cork bg-umber p-3', r.hidden && 'opacity-60')}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <strong className="block truncate text-sm font-medium">{name}</strong>
          <span className="flex flex-wrap items-center gap-2 text-[11px] text-sand">
            <Stars value={r.rating} size="xs" /> {r.authorName || 'Cliente'} · {formatDate(r.createdAt)}
            {r.hidden && <span className="rounded-full border border-cork px-2 py-0.5 text-[9px] uppercase">Oculta</span>}
          </span>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setReviewHiddenAction(r.id, !r.hidden), r.hidden ? 'Reseña visible de nuevo' : 'Reseña oculta')}>
            {r.hidden ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />} {r.hidden ? 'Mostrar' : 'Ocultar'}
          </Button>
          {confirm ? (
            <Button size="sm" variant="danger" disabled={pending} onClick={() => run(() => deleteReviewAction(r.id), 'Reseña borrada')}>
              ¿Borrar?
            </Button>
          ) : (
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirm(true)} aria-label="Borrar reseña">
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
      {(r.longevity || r.sillage) && (
        <p className="mt-1 text-[11px] text-sand">
          {r.longevity && `Duración: ${LONGEVITY_LABEL[r.longevity]}`}
          {r.longevity && r.sillage && ' · '}
          {r.sillage && `Estela: ${SILLAGE_LABEL[r.sillage]}`}
        </p>
      )}
      {r.comment && <p className="mt-2 whitespace-pre-line text-sm">{r.comment}</p>}
    </li>
  );
}
