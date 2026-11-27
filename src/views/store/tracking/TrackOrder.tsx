'use client';

import { useState, useTransition } from 'react';
import { trackOrderAction } from '@/controllers/checkout.controller';
import { formatDate } from '@/lib/utils/format';
import { itemText, statusLabel, trackingSteps } from '@/models/domain/orders';
import type { TrackedOrder } from '@/models/types';
import { Alert } from '@/views/shared/Alert';
import { Button } from '@/views/shared/Button';
import { Field, Input } from '@/views/shared/Field';
import { useStore } from '../state/StoreProvider';

/** Seguimiento de pedido con número y correo. */
export function TrackOrder() {
  const { price } = useStore();
  const [number, setNumber] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await trackOrderAction(number, email);
      setOrder(res.ok ? res.data : null);
      setError(res.ok ? null : res.error);
    });
  };

  const steps = order ? trackingSteps(order.items) : [];
  const at = order ? steps.indexOf(order.status) : -1;

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <p className="text-[11px] uppercase tracking-[0.14em] text-sand">Seguimiento</p>
      <h1 className="mt-2 text-3xl">Rastrea tu pedido</h1>
      <form onSubmit={submit} className="mt-6 space-y-3 rounded-3xl border border-cork bg-umber p-5">
        <Field label="Número de pedido">
          <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Ej. JS-1001" required />
        </Field>
        <Field label="Correo con el que compraste">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Button type="submit" variant="cream" className="w-full" disabled={pending}>
          {pending ? 'Buscando…' : 'Rastrear'}
        </Button>
        {error && <Alert>{error}</Alert>}
      </form>

      {order && (
        <div className="mt-6 space-y-4 rounded-3xl border border-cork bg-umber p-5 text-sm">
          <p className="font-medium">
            {order.number} · <span className="text-ember">{statusLabel(order.status)}</span>
          </p>
          {order.status !== 'cancelado' && (
            <ol className="space-y-1">
              {steps.map((s, i) => (
                <li key={s} className={i <= at ? 'text-cream' : 'text-drift'}>
                  {i <= at ? '●' : '○'} {statusLabel(s)}
                </li>
              ))}
            </ol>
          )}
          <div className="space-y-1 text-xs text-sand">
            {[...(order.events ?? [])].reverse().map((e, i) => (
              <p key={i}>
                {formatDate(e.at)} · <b className="text-cream">{statusLabel(e.status) || 'Actualización'}</b>
                {e.note ? ` — ${e.note}` : ''}
              </p>
            ))}
          </div>
          {order.tracking && (
            <p className="text-xs">
              Paquetería: <b>{order.carrier}</b>
              <br />
              Guía: <b>{order.tracking}</b>
              {order.tracking_url && /^https?:\/\//.test(order.tracking_url) && (
                <>
                  <br />
                  <a className="underline" href={order.tracking_url} target="_blank" rel="noopener noreferrer">
                    Rastrear paquete
                  </a>
                </>
              )}
            </p>
          )}
          <div className="border-t border-dashed border-cork pt-3 text-xs text-sand">
            {order.items.map((i, k) => (
              <p key={k}>{itemText(i)}</p>
            ))}
            <p className="mt-1">Envío: {price(order.shipping)}</p>
            {order.discount > 0 && <p>Descuento: -{price(order.discount)}</p>}
            <p className="text-cream">Total: {price(order.total)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
