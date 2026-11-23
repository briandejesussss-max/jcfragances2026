import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Customer, CustomerProfile } from '../types';

/** Tabla `profiles`: cada cliente lee y edita solo el suyo (el propietario puede leer todos). */

type Row = { id: string; name: string; phone: string; address: Partial<Customer> | null; notify_email: boolean };

const toProfile = (r: Row): CustomerProfile => ({
  id: r.id,
  name: r.name ?? '',
  phone: r.phone ?? '',
  address: r.address ?? {},
  notifyEmail: r.notify_email !== false,
});

export async function getProfile(db: SupabaseClient, id: string): Promise<CustomerProfile | null> {
  const { data, error } = await db.from('profiles').select('id,name,phone,address,notify_email').eq('id', id).maybeSingle();
  if (error) throw new Error(`No se pudo leer tu perfil: ${error.message}`);
  return data ? toProfile(data as Row) : null;
}

export async function saveProfile(db: SupabaseClient, p: CustomerProfile): Promise<void> {
  const { error } = await db.from('profiles').upsert({
    id: p.id,
    name: p.name,
    phone: p.phone,
    address: p.address,
    notify_email: p.notifyEmail,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`No se pudieron guardar tus datos: ${error.message}`);
}

/** Para el panel: perfiles de los clientes de una lista de pedidos. */
export async function getProfilesByIds(db: SupabaseClient, ids: string[]): Promise<Map<string, CustomerProfile>> {
  const map = new Map<string, CustomerProfile>();
  if (!ids.length) return map;
  const { data } = await db.from('profiles').select('id,name,phone,address,notify_email').in('id', ids);
  for (const r of (data ?? []) as Row[]) map.set(r.id, toProfile(r));
  return map;
}

/** Liga a la cuenta los pedidos hechos antes con el mismo correo (solo si el correo está confirmado). */
export async function claimMyOrders(db: SupabaseClient): Promise<number> {
  const { data, error } = await db.rpc('claim_my_orders');
  if (error) return 0;
  return Number(data) || 0;
}
