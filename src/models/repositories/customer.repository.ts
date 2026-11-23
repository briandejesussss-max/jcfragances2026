import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CustomerAccount, GuestBuyer } from '../types';

/** Cuentas de cliente para el panel (funciones de la base de datos que solo aceptan administradores). */

type Row = { id: string; email: string; name: string; phone: string; created_at: string; last_sign_in_at: string | null; orders_count: number };

export async function listCustomers(db: SupabaseClient, query = ''): Promise<CustomerAccount[]> {
  const { data, error } = await db.rpc('admin_list_customers', { p_query: query });
  if (error) throw new Error(`No se pudieron cargar los clientes: ${error.message}`);
  return ((data ?? []) as Row[]).map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    phone: r.phone,
    createdAt: r.created_at,
    lastSignInAt: r.last_sign_in_at,
    ordersCount: Number(r.orders_count) || 0,
  }));
}

export async function setCustomerPassword(db: SupabaseClient, userId: string, password: string): Promise<void> {
  const { error } = await db.rpc('admin_set_customer_password', { p_user_id: userId, p_password: password });
  if (!error) return;
  if (error.message.includes('es administrador')) throw new Error('Esa cuenta es de administrador; no se puede cambiar desde aquí.');
  if (error.message.includes('no encontrado')) throw new Error('No se encontró la cuenta del cliente.');
  throw new Error(`No se pudo cambiar la contraseña: ${error.message}`);
}

type GuestRow = { email: string; name: string; phone: string; orders_count: number; total: number; last_order_number: string; last_order_at: string; has_account: boolean };

export async function listGuestBuyers(db: SupabaseClient, query = ''): Promise<GuestBuyer[]> {
  const { data, error } = await db.rpc('admin_list_guest_buyers', { p_query: query });
  if (error) throw new Error(`No se pudieron cargar los compradores sin cuenta: ${error.message}`);
  return ((data ?? []) as GuestRow[]).map((r) => ({
    email: r.email,
    name: r.name,
    phone: r.phone,
    ordersCount: Number(r.orders_count) || 0,
    total: Number(r.total) || 0,
    lastOrderNumber: r.last_order_number,
    lastOrderAt: r.last_order_at,
    hasAccount: !!r.has_account,
  }));
}
