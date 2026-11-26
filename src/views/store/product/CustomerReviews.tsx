import { BadgeCheck, MessageSquareQuote } from 'lucide-react';
import { LONGEVITY_LABEL, SILLAGE_LABEL, summarizeReviews } from '@/models/domain/reviews';
import type { Review } from '@/models/types';
import { Stars } from '@/views/reviews/Stars';

const dateFmt = new Intl.DateTimeFormat('es-MX', { month: 'short', year: 'numeric', timeZone: 'America/Mexico_City' });

/** Reseñas reales de clientes con compra verificada. */
export function CustomerReviews({ reviews }: { reviews: Review[] }) {
  const s = summarizeReviews(reviews);
  return (
    <section id="resenas" className="scroll-mt-20 rounded-3xl border border-cork bg-umber p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[11px] tracking-[0.14em] text-sand">Reseñas de clientes</h2>
        <span className="inline-flex items-center gap-1 rounded-full border border-cork px-2 py-0.5 text-[9px] uppercase text-sand">
          <BadgeCheck className="size-3" /> Compras verificadas
        </span>
      </div>

      {s.count === 0 ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-bark/50 p-4 text-sm text-sand">
          <MessageSquareQuote className="mt-0.5 size-5 shrink-0 text-ember" />
          <p>
            Aún no hay reseñas de este perfume. Si lo compraste con tu cuenta, cuando tu pedido esté entregado podrás calificarlo desde <strong className="text-cream">Mis pedidos</strong>.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
            <div className="text-center sm:pr-4">
              <strong className="block font-mono text-4xl font-medium">{s.average.toFixed(1)}</strong>
              <Stars value={s.average} size="md" className="mt-1" />
              <span className="mt-1 block text-[11px] text-sand">
                {s.count} {s.count === 1 ? 'reseña' : 'reseñas'}
              </span>
            </div>
            <div className="space-y-1">
              {s.distribution.map((d) => (
                <div key={d.stars} className="flex items-center gap-2 text-[11px] text-sand">
                  <span className="w-6 font-mono">{d.stars}★</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-bark">
                    <span className="block h-full rounded-full bg-ember" style={{ width: `${(d.count / s.count) * 100}%` }} />
                  </span>
                  <span className="w-5 text-right font-mono">{d.count}</span>
                </div>
              ))}
              {(s.longevity || s.sillage) && (
                <p className="pt-2 text-xs text-sand">
                  Según los clientes: {s.longevity && <>duración <strong className="text-cream">{LONGEVITY_LABEL[s.longevity.value].toLowerCase()}</strong></>}
                  {s.longevity && s.sillage && ' · '}
                  {s.sillage && <>estela <strong className="text-cream">{SILLAGE_LABEL[s.sillage.value].toLowerCase()}</strong></>}
                </p>
              )}
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-2xl border border-cork p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm">
                    <strong className="font-medium">{r.authorName || 'Cliente'}</strong>
                    <span className="inline-flex items-center gap-0.5 text-[10px] uppercase tracking-[0.06em] text-ember">
                      <BadgeCheck className="size-3" /> Compra verificada
                    </span>
                  </span>
                  <span className="text-[11px] text-drift">{dateFmt.format(new Date(r.createdAt))}</span>
                </div>
                <Stars value={r.rating} size="xs" className="mt-1" />
                {(r.longevity || r.sillage) && (
                  <p className="mt-1 text-[11px] text-sand">
                    {r.longevity && `Duración: ${LONGEVITY_LABEL[r.longevity]}`}
                    {r.longevity && r.sillage && ' · '}
                    {r.sillage && `Estela: ${SILLAGE_LABEL[r.sillage]}`}
                  </p>
                )}
                {r.comment && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{r.comment}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
