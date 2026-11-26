'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Eye, EyeOff, Trash2 } from 'lucide-react';
import { approveReviewAction, deleteReviewAction, setReviewHiddenAction } from '@/controllers/review.controller';
import { formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { LONGEVITY_LABEL, SILLAGE_LABEL } from '@/models/domain/reviews';
import type { Review } from '@/models/types';
import { Button } from '@/views/shared/Button';
import { useToast } from '@/views/shared/Toast';
import { Stars } from '@/views/reviews/Stars';
import { ReviewTag } from '@/views/store/product/CustomerReviews';
import { PageTitle } from '../shared/PageTitle';

type Filter = 'pending' | 'visible' | 'hidden' | 'all';
const MATCH: Record<Filter, (r: Review) => boolean> = {
  pending: (r) => r.pending && !r.hidden,
  visible: (r) => !r.pending && !r.hidden,
  hidden: (r) => r.hidden,
  all: () => true,
};
const LABEL: Record<Filter, string> = { pending: 'Por aprobar', visible: 'Publicadas', hidden: 'Ocultas', all: 'Todas' };

/** Panel → Reseñas: ver, ocultar/mostrar o borrar reseñas de clientes. */
export function ReviewsModeration({ reviews, names }: { reviews: Review[]; names: Record<string, string> }) {
  const toApprove = reviews.filter(MATCH.pending).length;
  const [filter, setFilter] = useState<Filter>(toApprove ? 'pending' : 'visible');
  const shown = reviews.filter(MATCH[filter]);
  const published = reviews.filter(MATCH.visible);
  const avg = published.length ? published.reduce((a, r) => a + r.rating, 0) / published.length : 0;

  return (
    <>
      <PageTitle title="Reseñas">
        <div className="flex flex-wrap gap-1">
          {(Object.keys(LABEL) as Filter[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={filter === k}
              onClick={() => setFilter(k)}
              className={cn('rounded-pill border px-3 py-1.5 text-[11px] uppercase', filter === k ? 'border-cream bg-cream text-walnut' : 'border-cork text-sand hover:text-cream')}
            >
              {LABEL[k]} ({reviews.filter(MATCH[k]).length})
            </button>
          ))}
        </div>
      </PageTitle>
      <p className="mb-4 text-sm text-sand">
        {reviews.length === 0
          ? 'Todavía no hay reseñas. Cualquier persona puede escribir una desde la ficha del perfume.'
          : `${published.length} publicadas · promedio ${avg.toFixed(1)} ★. Las “Opinión” (sin compra) esperan tu aprobación; las de “Compra verificada” se publican solas. Las pendientes y ocultas no se ven en la tienda ni cuentan en el promedio.`}
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
            <Stars value={r.rating} size="xs" /> {r.authorName || 'Cliente'} · {formatDate(r.createdAt)} · <ReviewTag verified={r.verified} />
            {r.hidden && <span className="rounded-full border border-cork px-2 py-0.5 text-[9px] uppercase">Oculta</span>}
          </span>
        </div>
        <div className="flex gap-1">
          {r.pending && !r.hidden && (
            <Button size="sm" variant="cream" disabled={pending} onClick={() => run(() => approveReviewAction(r.id), 'Reseña aprobada y publicada')}>
              <Check className="size-3.5" /> Aprobar
            </Button>
          )}
          {!(r.pending && !r.hidden) && (
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setReviewHiddenAction(r.id, !r.hidden), r.hidden ? 'Reseña visible de nuevo' : 'Reseña oculta')}>
              {r.hidden ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />} {r.hidden ? 'Mostrar' : 'Ocultar'}
            </Button>
          )}
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
