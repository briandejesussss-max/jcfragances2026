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

/**
 * Liga a la cuenta un pedido hecho sin sesión. Pide el número Y el correo con el que se compró
 * (los mismos datos del rastreo público), porque sin confirmación de correo la cuenta no prueba que el correo sea suyo.
 */
export async function claimOrder(db: SupabaseClient, number: string, email: string): Promise<{ ok: true; number: string } | { ok: false; reason: 'not_found' | 'taken' | 'error' }> {
  const { data, error } = await db.rpc('claim_order', { p_number: number, p_email: email });
  if (!error) return { ok: true, number: String(data) };
  if (error.message.includes('no encontrado')) return { ok: false, reason: 'not_found' };
  if (error.message.includes('ya ligado')) return { ok: false, reason: 'taken' };
  return { ok: false, reason: 'error' };
}
