'use server';

import { createSupabasePublicClient } from '@/lib/supabase/server';
import { buildOrderItems, itemsSubtotal, shippingFor, validateCustomer } from '@/models/domain/orders';
import { sizesOf, stockIssues } from '@/models/domain/sizes';
import { getFragrancesByIds } from '@/models/repositories/fragrance.repository';
import { createOrder, trackOrder } from '@/models/repositories/order.repository';
import { getStoreConfig } from '@/models/repositories/store-config.repository';
import type { ActionResult, CartLine, Customer, OrderItem, TrackedOrder } from '@/models/types';
import { runAction, UserError } from './action-result';

export interface PlacedOrder {
  number: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
}

const clean = (v: unknown, max = 160) => String(v ?? '').trim().slice(0, max);

function sanitizeCustomer(c: Partial<Customer>): Customer {
  return {
    name: clean(c.name),
    phone: clean(c.phone, 20).replace(/[^\d+ ]/g, ''),
    email: clean(c.email).toLowerCase(),
    street: clean(c.street),
    numExt: clean(c.numExt, 20),
    numInt: clean(c.numInt, 20),
    cp: clean(c.cp, 5).replace(/\D/g, ''),
    colonia: clean(c.colonia),
    city: clean(c.city),
    state: clean(c.state),
  };
}

/**
 * Crea el pedido. Vuelve a leer precios e inventario de la base de datos, recalcula subtotal,
 * envío y total en el servidor y solo entonces llama a `create_order`.
 */
export async function placeOrder(input: { customer: Partial<Customer>; lines: CartLine[] }): Promise<ActionResult<PlacedOrder>> {
  return runAction(async () => {
    const customer = sanitizeCustomer(input.customer ?? {});
    const invalid = validateCustomer(customer);
    if (invalid) throw new UserError(invalid);

    const lines = (input.lines ?? [])
      .filter((l) => l && typeof l.fragId === 'string' && typeof l.size === 'string')
      .slice(0, 60)
      .map((l) => ({ fragId: l.fragId, size: l.size, qty: Math.floor(Number(l.qty)) }));
    if (!lines.length) throw new UserError('Agrega al menos una fragancia a tu bolsa');

    const db = createSupabasePublicClient();
    const [config, byId] = await Promise.all([getStoreConfig(db), getFragrancesByIds(db, [...new Set(lines.map((l) => l.fragId))])]);
    const sizes = sizesOf(config);

    const issues = stockIssues(lines, byId, sizes);
    if (issues.length) throw new UserError(`Algunas existencias cambiaron: ${issues.join(' · ')}`);

    const { items, errors } = buildOrderItems(lines, byId, sizes);
    if (errors.length) throw new UserError(errors.join(' · '));

    const subtotal = itemsSubtotal(items);
    const shipping = shippingFor(customer.cp);
    const total = subtotal + shipping;

    let number: string;
    try {
      number = await createOrder(db, { customer, items, total, shipping });
    } catch (e) {
      throw new UserError(`No se pudo registrar el pedido (${e instanceof Error ? e.message : 'error'}). Intenta de nuevo`);
    }
    return { number, items, subtotal, shipping, total };
  });
}

/** Seguimiento público: requiere número de pedido y el correo con el que se compró. */
export async function trackOrderAction(number: string, email: string): Promise<ActionResult<TrackedOrder>> {
  return runAction(async () => {
    const n = clean(number, 30);
    const m = clean(email, 160);
    if (!n || !m) throw new UserError('Escribe tu número de pedido y tu correo');
    const order = await trackOrder(createSupabasePublicClient(), n, m);
    if (!order) throw new UserError('No encontramos ese pedido. Revisa el número y el correo.');
    return order;
  });
}
