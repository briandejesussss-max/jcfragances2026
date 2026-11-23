'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { headers } from 'next/headers';
import { requireAdminAction } from '@/lib/auth/session';
import { sendEmail, siteUrl, type EmailResult } from '@/lib/services/email';
import { itemsSubtotal } from '@/models/domain/orders';
import { deductItem, sizesOf } from '@/models/domain/sizes';
import { getFragrancesByIds, saveFragranceData } from '@/models/repositories/fragrance.repository';
import { getOrder, updateOrder } from '@/models/repositories/order.repository';
import { getProfile } from '@/models/repositories/profile.repository';
import { getStoreConfig } from '@/models/repositories/store-config.repository';
import { orderStatusEmail } from '@/views/emails/order-status-email';
import type { ActionResult, Fragrance, Order, OrderStatus } from '@/models/types';
import { runAction, UserError } from './action-result';
import { CATALOG_TAG } from './catalog.controller';

const STATUSES: OrderStatus[] = ['pendiente_pago', 'pagado', 'proveedor', 'transito', 'recibido', 'enviado', 'entregado', 'cancelado'];
const ORDERS_PATH = '/admin/pedidos';

/** Ajusta el envío (zona extendida o paquetería elegida) y recalcula el total. */
export async function setOrderShippingAction(id: string, shipping: number): Promise<ActionResult> {
  return runAction(async () => {
    const db = await requireAdminAction();
    const n = Number(shipping);
    if (!Number.isFinite(n) || n < 0) throw new UserError('Escribe un monto de envío válido');
    const o = await getOrder(db, id);
    if (!o) throw new UserError('No se pudo leer el pedido');
    await updateOrder(db, id, { shipping: n, total: o.total - o.shipping + n });
    revalidatePath(ORDERS_PATH);
    return undefined;
  });
}

/** Descuento manual de un pedido (solo antes de marcarlo pagado). No toca los precios del catálogo. */
export async function setOrderDiscountAction(id: string, discount: number): Promise<ActionResult> {
  return runAction(async () => {
    const db = await requireAdminAction();
    const n = Math.round((Number(discount) || 0) * 100) / 100;
    if (!Number.isFinite(n) || n < 0) throw new UserError('Escribe un descuento válido');
    const o = await getOrder(db, id);
    if (!o) throw new UserError('No se pudo leer el pedido');
    if (o.status !== 'pendiente_pago') throw new UserError('El descuento solo se puede cambiar antes de marcar pagado');
    if (n > itemsSubtotal(o.items)) throw new UserError('El descuento no puede ser mayor al valor de los productos');
    await updateOrder(db, id, { discount: n, total: o.total + o.discount - n });
    revalidatePath(ORDERS_PATH);
    return undefined;
  });
}

export interface StatusChange {
  /** null = solo agregar una nota al seguimiento */
  status: OrderStatus | null;
  note?: string;
  carrier?: string;
  tracking?: string;
  trackingUrl?: string;
}

/**
 * Cambia la etapa del pedido y registra el evento. Al marcarlo pagado descuenta el inventario
 * (lo bajo pedido no descuenta). El ingreso en finanzas lo crea el trigger `orders_to_income`.
 */
export async function setOrderStatusAction(id: string, change: StatusChange): Promise<ActionResult<{ email: EmailResult | 'off' | 'guest' }>> {
  return runAction(async () => {
    const db = await requireAdminAction();
    const o = await getOrder(db, id);
    if (!o) throw new UserError('No se pudo leer el pedido');

    const now = new Date().toISOString();
    let note = String(change.note ?? '').trim();
    const patch: Partial<Order> = {};
    let status: OrderStatus;

    if (change.status === null) {
      if (!note) throw new UserError('Escribe la nota');
      status = o.status;
    } else {
      if (!STATUSES.includes(change.status)) throw new UserError('Estado no válido');
      status = change.status;
      patch.status = status;
      if (status === 'pagado') patch.paid_at = now;
      if (status === 'entregado') patch.delivered_at = now;
      if (status === 'enviado') {
        const carrier = String(change.carrier ?? '').trim();
        const tracking = String(change.tracking ?? '').trim();
        if (!carrier || !tracking) throw new UserError('Escribe la paquetería y el número de guía');
        const url = String(change.trackingUrl ?? '').trim();
        Object.assign(patch, { carrier, tracking, tracking_url: /^https?:\/\//.test(url) ? url : null, shipped_at: now });
        note = [note, `${carrier} · guía ${tracking}`].filter(Boolean).join(' — ');
      }
    }
    patch.events = [...(o.events ?? []), { at: now, status, note }];

    const markPaid = status === 'pagado' && o.status !== 'pagado';
    if (markPaid) {
      const config = await getStoreConfig(db);
      const sizes = sizesOf(config);
      const byId = await getFragrancesByIds(db, [...new Set(o.items.map((i) => i.fragId))]);
      const changed = new Map<string, Fragrance>();
      for (const item of o.items) {
        const f = changed.get(item.fragId) ?? byId.get(item.fragId);
        if (f) changed.set(item.fragId, deductItem(f, item, sizes));
      }
      await saveFragranceData(db, [...changed.values()]);
    }

    await updateOrder(db, id, patch);
    if (markPaid) updateTag(CATALOG_TAG);
    revalidatePath(ORDERS_PATH);

    // Aviso por correo al cliente con cuenta que lo tenga activado.
    let email: EmailResult | 'off' | 'guest' = 'guest';
    if (o.user_id) {
      const profile = await getProfile(db, o.user_id).catch(() => null);
      const to = o.customer?.email;
      if (!profile?.notifyEmail || !to) email = 'off';
      else {
        const updated: Order = { ...o, ...patch } as Order;
        const config = await getStoreConfig(db);
        const h = await headers();
        const url = `${siteUrl(h.get('origin'))}/cuenta/pedidos/${encodeURIComponent(o.number)}`;
        email = await sendEmail({ to, ...orderStatusEmail(updated, config, url) });
      }
    }
    return { email };
  });
}
