import 'server-only';

import { requireCustomerPage } from '@/lib/auth/session';
import { getOrderOfUser, listOrdersOfUser } from '@/models/repositories/order.repository';
import { getProfile } from '@/models/repositories/profile.repository';
import type { CustomerProfile } from '@/models/types';

/** Cargadores de "Mi cuenta" (siempre frescos, con la sesión del cliente). */

export async function loadMyOrders() {
  const { db, user } = await requireCustomerPage('/cuenta');
  const [orders, profile] = await Promise.all([listOrdersOfUser(db, user.id), getProfile(db, user.id).catch(() => null)]);
  return { orders, profile, email: user.email ?? '' };
}

export async function loadWelcome() {
  const { db, user } = await requireCustomerPage('/cuenta/bienvenida');
  const [orders, profile] = await Promise.all([listOrdersOfUser(db, user.id), getProfile(db, user.id).catch(() => null)]);
  return { orders, profile, email: user.email ?? '' };
}

export async function loadMyOrder(number: string) {
  const { db, user } = await requireCustomerPage(`/cuenta/pedidos/${encodeURIComponent(number)}`);
  return getOrderOfUser(db, user.id, number);
}

export async function loadMyProfile(): Promise<{ profile: CustomerProfile; email: string; providers: string[] }> {
  const { db, user } = await requireCustomerPage('/cuenta/perfil');
  const profile = (await getProfile(db, user.id).catch(() => null)) ?? { id: user.id, name: '', phone: '', address: {}, notifyEmail: true };
  return { profile, email: user.email, providers: user.providers };
}
