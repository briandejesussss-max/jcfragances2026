import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BANK } from '@/config/store';
import { formatClabe, formatDate, formatMoney } from '@/lib/utils/format';
import { whatsappLink } from '@/lib/utils/whatsapp';
import { itemText } from '@/models/domain/orders';
import type { MyReview, Order, StoreConfig } from '@/models/types';
import { buttonClass } from '@/views/shared/Button';
import { cn } from '@/lib/utils/cn';
import { orderSteps } from './order-progress';
import { OrderStatusBadge } from './OrderStatusBadge';
import { RateItems } from './RateItems';

/** Detalle de un pedido del cliente: línea de etapas con notas, paquetería, productos y pago. */
export function OrderDetail({ order: o, config, reviews }: { order: Order; config: StoreConfig; reviews: MyReview[] }) {
  const steps = orderSteps(o);
  const cancelled = o.status === 'cancelado';
  const ask = whatsappLink(config.whatsapp, `Hola, tengo una pregunta sobre mi pedido ${o.number}.`);
  const proof = whatsappLink(config.whatsapp, `Hola, ya hice mi transferencia del pedido ${o.number} por ${formatMoney(o.total)}. Te envío mi comprobante.`);

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      <Link href="/cuenta" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-sand hover:text-cream">
        <ArrowLeft className="size-4" /> Mis pedidos
      </Link>
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.14em] text-sand">Pedido · {formatDate(o.created_at)}</p>
        <h1 className="text-4xl normal-case">{o.number}</h1>
        <OrderStatusBadge order={o} />
      </div>

      {o.status === 'entregado' && <RateItems items={o.items} reviews={reviews} />}

      {cancelled ? (
        <div className="rounded-3xl border border-bad/50 bg-bad/10 p-4 text-sm text-bad">Este pedido fue cancelado. Si tienes dudas, escríbenos por WhatsApp.</div>
      ) : (
        <section aria-label="Seguimiento" className="rounded-3xl border border-cork bg-umber p-4 sm:p-5">
          <ol>
            {steps.map((s, i) => (
              <li key={s.status} className="flex gap-3.5">
                <div className="flex w-4 flex-col items-center">
                  <span
                    className={cn(
                      'size-3.5 shrink-0 rounded-full border-2',
                      s.state === 'done' && 'border-ember bg-ember',
                      s.state === 'current' && 'border-ember bg-walnut',
                      s.state === 'todo' && 'border-cork',
                    )}
                  />
                  {i < steps.length - 1 && <span className={cn('min-h-6 w-0.5 flex-1', s.state === 'done' ? 'bg-ember' : 'bg-cork')} />}
                </div>
                <div className="flex flex-col gap-0.5 pb-4">
                  <span className={cn('text-sm font-medium', s.state === 'current' ? 'text-ember' : s.state === 'done' ? 'text-cream' : 'text-sand')}>
                    {s.label}
                    {s.state === 'current' && <span className="sr-only"> (etapa actual)</span>}
                  </span>
                  <span className="text-xs leading-relaxed text-sand">
                    {s.at ? formatDate(s.at) : s.state === 'todo' ? 'Pendiente' : ''}
                    {s.note ? `${s.at ? ' · ' : ''}${s.status === 'pendiente_pago' ? s.note : `“${s.note}”`}` : ''}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {o.status === 'pendiente_pago' && (
        <section className="space-y-1.5 rounded-3xl border border-cork bg-umber p-4 text-sm">
          <p className="text-[11px] uppercase tracking-[0.1em] text-sand">Transferencia</p>
          <p>
            Monto: <b className="font-medium">{formatMoney(o.total)}</b>
          </p>
          <p>
            CLABE: <b className="font-mono font-medium">{formatClabe(BANK.clabe)}</b> · {BANK.bank}
          </p>
          <p>
            Titular: {BANK.holder} · Concepto: <b className="font-medium">{o.number}</b>
          </p>
          <a href={proof} target="_blank" rel="noopener noreferrer" className={buttonClass('whatsapp', 'md', 'mt-2 w-full')}>
            Enviar comprobante por WhatsApp
          </a>
        </section>
      )}

      <section className="space-y-2 rounded-3xl border border-dashed border-cork p-4 text-sm">
        <p className="text-[11px] uppercase tracking-[0.1em] text-sand">Paquetería</p>
        {o.tracking ? (
          <>
            <p>
              {o.carrier} · Guía <b className="font-medium">{o.tracking}</b>
            </p>
            {o.tracking_url && /^https?:\/\//.test(o.tracking_url) && (
              <a href={o.tracking_url} target="_blank" rel="noopener noreferrer" className={buttonClass('ghost', 'md', 'w-full')}>
                Rastrear paquete
              </a>
            )}
          </>
        ) : (
          <p className="text-sand">La guía aparece aquí cuando marquemos tu pedido como enviado.</p>
        )}
      </section>

      <section className="space-y-2 rounded-3xl border border-cork bg-umber p-4 text-sm">
        <p className="text-[11px] uppercase tracking-[0.1em] text-sand">Productos</p>
        {o.items.map((i, k) => (
          <div key={k} className="flex justify-between gap-3">
            <span>{itemText(i)}</span>
            <span className="shrink-0">{formatMoney(i.price * i.qty)}</span>
          </div>
        ))}
        <div className="flex justify-between text-sand">
          <span>Envío</span>
          <span>{formatMoney(o.shipping)}</span>
        </div>
        {o.discount > 0 && (
          <div className="flex justify-between text-ok">
            <span>Descuento</span>
            <span>−{formatMoney(o.discount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-dashed border-cork pt-2 text-base font-medium">
          <span>Total</span>
          <span>{formatMoney(o.total)}</span>
        </div>
      </section>

      <a href={ask} target="_blank" rel="noopener noreferrer" className={buttonClass('whatsapp', 'lg', 'w-full')}>
        Preguntar por WhatsApp
      </a>
    </div>
  );
}
