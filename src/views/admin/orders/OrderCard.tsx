'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setOrderDiscountAction, setOrderShippingAction, setOrderStatusAction, type StatusChange } from '@/controllers/order-admin.controller';
import { formatDate, formatMoney } from '@/lib/utils/format';
import { whatsappLink } from '@/lib/utils/whatsapp';
import { canAddNote, canCancel, customerAddress, customerMessage, itemText, nextActions, statusLabel } from '@/models/domain/orders';
import type { ActionResult, Order } from '@/models/types';
import { Button, buttonClass } from '@/views/shared/Button';
import { Input } from '@/views/shared/Field';
import { useToast } from '@/views/shared/Toast';
import { cn } from '@/lib/utils/cn';

const STATUS_TONE: Record<string, string> = {
  pendiente_pago: 'text-ember',
  entregado: 'text-ok',
  cancelado: 'text-bad',
};

export function OrderCard({ order: o }: { order: Order }) {
  const router = useRouter();
  const notify = useToast();
  const [pending, start] = useTransition();
  const [shipping, setShipping] = useState(String(o.shipping));
  const [discount, setDiscount] = useState(String(o.discount));
  const [carrier, setCarrier] = useState('');
  const [tracking, setTracking] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [note, setNote] = useState('');
  const c = o.customer;
  const actions = nextActions(o);
  const message = customerMessage(o);

  const run = (fn: () => Promise<ActionResult>, ok: string) =>
    start(async () => {
      const res = await fn();
      notify(res.ok ? ok : res.error, res.ok ? 2600 : 4500);
      if (res.ok) router.refresh();
    });

  const change = (status: StatusChange['status']) => run(() => setOrderStatusAction(o.id, { status, note, carrier, tracking, trackingUrl }), 'Pedido actualizado ✓');

  return (
    <article className="space-y-2 rounded-3xl border border-cork bg-umber p-4 text-xs">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <b className="text-sm font-medium">{o.number}</b>
        <span className={cn('font-medium uppercase', STATUS_TONE[o.status] ?? 'text-cream')}>{statusLabel(o.status)}</span>
      </div>
      <p className="text-[11px] text-drift">{formatDate(o.created_at)}</p>
      <div>
        {c.name} · {c.phone}
        <br />
        {c.email}
      </div>
      <p className="text-sand">{customerAddress(c)}</p>
      <div className="space-y-0.5 border-t border-dashed border-cork pt-2">
        {o.items.map((i, k) => (
          <p key={k}>{itemText(i)}</p>
        ))}
        <p className="text-sand">Envío: {formatMoney(o.shipping)}</p>
        {o.discount > 0 && <p className="text-ember">Descuento: -{formatMoney(o.discount)}</p>}
        <p className="text-sm font-medium">Total: {formatMoney(o.total)}</p>
      </div>

      <div className="space-y-2 border-t border-dashed border-cork pt-2">
        {o.status === 'pendiente_pago' && (
          <>
            <Row>
              <span className="w-20 shrink-0">Envío $</span>
              <Input type="number" min={0} value={shipping} onChange={(e) => setShipping(e.target.value)} className="py-1" />
              <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setOrderShippingAction(o.id, parseFloat(shipping)), 'Envío actualizado ✓ Avisa al cliente por WhatsApp')}>
                Actualizar
              </Button>
            </Row>
            <Row>
              <span className="w-20 shrink-0">Descuento $</span>
              <Input type="number" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)} className="py-1" />
              <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setOrderDiscountAction(o.id, parseFloat(discount)), 'Descuento aplicado ✓ Avisa al cliente por WhatsApp')}>
                Aplicar
              </Button>
            </Row>
          </>
        )}

        {actions.some((a) => a.needsShipping) && (
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Paquetería" value={carrier} onChange={(e) => setCarrier(e.target.value)} className="py-1" />
            <Input placeholder="No. de guía" value={tracking} onChange={(e) => setTracking(e.target.value)} className="py-1" />
            <Input placeholder="Link de rastreo (opcional)" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} className="col-span-2 py-1" />
          </div>
        )}

        {canAddNote(o.status) && <Input placeholder="Nota para el cliente (opcional)" value={note} onChange={(e) => setNote(e.target.value)} className="py-1" />}

        <div className="flex flex-wrap gap-2">
          {actions.map((a) => (
            <Button key={a.status} size="sm" variant="cream" disabled={pending} onClick={() => change(a.status)}>
              {a.label}
            </Button>
          ))}
          {canAddNote(o.status) && (
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => change(null)}>
              Solo agregar nota
            </Button>
          )}
          {canCancel(o.status) && (
            <Button
              size="sm"
              variant="danger"
              disabled={pending}
              onClick={() => confirm(`¿Cancelar el pedido ${o.number}? Si ya estaba pagado, el ingreso y el inventario no se revierten solos.`) && change('cancelado')}
            >
              Cancelar pedido
            </Button>
          )}
          {message && (
            <a href={whatsappLink(c.phone, message)} target="_blank" rel="noopener noreferrer" className={buttonClass('whatsapp', 'sm')}>
              Avisar por WhatsApp
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>;
}
