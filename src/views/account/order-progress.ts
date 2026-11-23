import { statusLabel, trackingSteps } from '@/models/domain/orders';
import type { Order, OrderStatus } from '@/models/types';

/** Etapas de un pedido para la línea de seguimiento del cliente (con fecha y nota de cada etapa). */
export interface Step {
  status: OrderStatus;
  label: string;
  state: 'done' | 'current' | 'todo';
  at?: string;
  note?: string;
}

export function orderSteps(o: Pick<Order, 'status' | 'items' | 'events' | 'created_at'>): Step[] {
  const steps = trackingSteps(o.items);
  const reached = steps.indexOf(o.status);
  return steps.map((status, i) => {
    const event = [...(o.events ?? [])].reverse().find((e) => e.status === status);
    return {
      status,
      label: status === 'pendiente_pago' ? 'Pedido registrado' : statusLabel(status),
      state: i < reached ? 'done' : i === reached ? 'current' : 'todo',
      at: event?.at ?? (status === 'pendiente_pago' ? o.created_at : undefined),
      note: event?.note || (status === 'pendiente_pago' && o.status === 'pendiente_pago' ? 'Esperando tu transferencia' : undefined),
    };
  });
}

export const lastNote = (o: Pick<Order, 'events'>) => [...(o.events ?? [])].reverse().find((e) => e.note);
