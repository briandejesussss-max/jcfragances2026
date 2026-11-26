import 'server-only';

import { requireAdminPage } from '@/lib/auth/session';
import { getAppSettings, listMovements } from '@/models/repositories/finance.repository';
import { getFragrance, listFragranceSummaries } from '@/models/repositories/fragrance.repository';
import { listOrders, listOrderTotals } from '@/models/repositories/order.repository';
import { listCustomers, listGuestBuyers } from '@/models/repositories/customer.repository';
import { getProfilesByIds } from '@/models/repositories/profile.repository';
import { adminListReviews } from '@/models/repositories/review.repository';
import { getAdminStats } from '@/models/repositories/stats.repository';
import { getStoreConfig } from '@/models/repositories/store-config.repository';

/**
 * Cargadores de datos del panel. Siempre leen datos frescos con la sesión del propietario
 * (sin caché) y redirigen al login si no hay sesión.
 */

export async function loadAdminCatalog() {
  const { db } = await requireAdminPage();
  const [config, fragrances] = await Promise.all([getStoreConfig(db), listFragranceSummaries(db)]);
  return { config, fragrances };
}

export async function loadAdminFragrance(id: string) {
  const { db } = await requireAdminPage();
  const [config, fragrance] = await Promise.all([getStoreConfig(db), getFragrance(db, id)]);
  return { config, fragrance };
}

export async function loadAdminStoreConfig() {
  const { db } = await requireAdminPage();
  return getStoreConfig(db);
}

export async function loadAdminOrders() {
  const { db } = await requireAdminPage();
  const orders = await listOrders(db, 100);
  const profiles = await getProfilesByIds(db, [...new Set(orders.map((o) => o.user_id).filter((x): x is string => !!x))]);
  // Para el panel solo importa si el cliente tiene cuenta y si quiere avisos por correo.
  const accounts = Object.fromEntries([...profiles].map(([id, p]) => [id, { notifyEmail: p.notifyEmail }]));
  return { orders, accounts };
}

export async function loadFinance() {
  const { db } = await requireAdminPage();
  const [movements, orders, settings] = await Promise.all([listMovements(db), listOrderTotals(db), getAppSettings(db)]);
  return { movements, orders, settings };
}

/** Clientes con cuenta y personas que compraron sin cuenta (para las dos vistas de la pestaña Clientes). */
export async function loadCustomers(query: string) {
  const { db } = await requireAdminPage();
  const q = query.slice(0, 80);
  const [customers, guests] = await Promise.all([listCustomers(db, q), listGuestBuyers(db, q)]);
  return { customers, guests };
}

/** Reseñas para moderar, con el nombre del perfume. */
export async function loadAdminReviews() {
  const { db } = await requireAdminPage();
  const [reviews, fragrances] = await Promise.all([adminListReviews(db), listFragranceSummaries(db)]);
  const names = Object.fromEntries(fragrances.map((f) => [f.id, `${f.brand} ${f.name}`]));
  return { reviews, names };
}

export const STATS_RANGES = [7, 30, 90] as const;

export async function loadAdminStats(days: number) {
  const { db } = await requireAdminPage();
  const range = (STATS_RANGES as readonly number[]).includes(days) ? days : 30;
  return getAdminStats(db, range);
}
