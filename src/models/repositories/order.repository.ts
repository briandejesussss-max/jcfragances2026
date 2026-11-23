import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Customer, Order, OrderItem, TrackedOrder } from '../types';

/** Tabla `orders` y funciones RPC públicas `create_order` / `track_order`. */

const num = (v: unknown) => Number(v ?? 0);

const toOrder = (r: Record<string, unknown>): Order =>
  ({
    ...r,
    total: num(r.total),
    shipping: num(r.shipping),
    discount: num(r.discount),
    events: (r.events as Order['events']) ?? [],
    items: (r.items as OrderItem[]) ?? [],
  }) as Order;

export async function createOrder(
  db: SupabaseClient,
  input: { customer: Customer; items: OrderItem[]; total: number; shipping: number },
): Promise<string> {
  const { data, error } = await db.rpc('create_order', {
    p_customer: input.customer,
    p_items: input.items,
    p_total: input.total,
    p_shipping: input.shipping,
  });
  if (error) throw new Error(error.message || error.code);
  return String(data);
}

export async function trackOrder(db: SupabaseClient, number: string, email: string): Promise<TrackedOrder | null> {
  const { data, error } = await db.rpc('track_order', { p_number: number, p_email: email });
  if (error || !Array.isArray(data) || !data.length) return null;
  return toOrder(data[0]) as TrackedOrder;
}

export async function listOrders(db: SupabaseClient, limit = 100): Promise<Order[]> {
  const { data, error } = await db.from('orders').select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) throw new Error(`No se pudieron cargar los pedidos: ${error.message}`);
  return (data ?? []).map(toOrder);
}

export async function getOrder(db: SupabaseClient, id: string): Promise<Order | null> {
  const { data, error } = await db.from('orders').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`No se pudo leer el pedido: ${error.message}`);
  return data ? toOrder(data) : null;
}

export async function updateOrder(db: SupabaseClient, id: string, patch: Partial<Order>): Promise<void> {
  const { error } = await db.from('orders').update(patch).eq('id', id);
  if (error) throw new Error(`No se pudo actualizar el pedido: ${error.message}`);
}

/** Resumen para el tablero de finanzas. */
export async function listOrderTotals(db: SupabaseClient): Promise<Pick<Order, 'status' | 'total'>[]> {
  const { data, error } = await db.from('orders').select('status,total');
  if (error) return [];
  return (data ?? []).map((r) => ({ status: r.status, total: num(r.total) }));
}
