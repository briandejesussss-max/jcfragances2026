import 'server-only';

import { requireCustomerPage } from '@/lib/auth/session';
import { getOrderOfUser, listOrdersOfUser } from '@/models/repositories/order.repository';
import { claimMyOrders, getProfile } from '@/models/repositories/profile.repository';
import type { CustomerProfile } from '@/models/types';

/** Cargadores de "Mi cuenta" (siempre frescos, con la sesión del cliente). */

export async function loadMyOrders() {
  const { db, user } = await requireCustomerPage('/cuenta');
  // Liga pedidos hechos sin sesión con el mismo correo (solo si el correo está confirmado).
  await claimMyOrders(db);
  const [orders, profile] = await Promise.all([listOrdersOfUser(db, user.id), getProfile(db, user.id).catch(() => null)]);
  return { orders, profile, email: user.email ?? '' };
}

export async function loadWelcome() {
  const { db, user } = await requireCustomerPage('/cuenta/bienvenida');
  const linked = await claimMyOrders(db);
  const [orders, profile] = await Promise.all([listOrdersOfUser(db, user.id), getProfile(db, user.id).catch(() => null)]);
  return { linked, orders, profile, email: user.email ?? '' };
}

export async function loadMyOrder(number: string) {
  const { db, user } = await requireCustomerPage(`/cuenta/pedidos/${encodeURIComponent(number)}`);
  return getOrderOfUser(db, user.id, number);
}

export async function loadMyProfile(): Promise<{ profile: CustomerProfile; email: string; providers: string[] }> {
  const { db, user } = await requireCustomerPage('/cuenta/perfil');
  const profile = (await getProfile(db, user.id).catch(() => null)) ?? { id: user.id, name: '', phone: '', address: {}, notifyEmail: true };
  const providers = ((user.app_metadata?.providers as string[] | undefined) ?? [user.app_metadata?.provider ?? 'email']).filter(Boolean);
  return { profile, email: user.email ?? '', providers };
}
