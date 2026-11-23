import 'server-only';

import { redirect } from 'next/navigation';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Sesiones. Propietario y clientes usan el mismo Supabase Auth; el propietario se distingue
 * porque está en la tabla `admins` (función `is_admin()`). La base de datos aplica la misma regla.
 */

async function currentUser(): Promise<{ db: SupabaseClient; user: User | null }> {
  const db = await createSupabaseServerClient();
  const { data } = await db.auth.getUser();
  return { db, user: data.user ?? null };
}

async function isAdmin(db: SupabaseClient): Promise<boolean> {
  const { data, error } = await db.rpc('is_admin');
  return !error && data === true;
}

/** Usuario con sesión (cliente o propietario) o null. getUser() valida el token con Supabase. */
export async function getSessionUser(): Promise<User | null> {
  return (await currentUser()).user;
}

/** Páginas del panel: sin sesión → login; con sesión de cliente → "No autorizado". */
export async function requireAdminPage(): Promise<{ db: SupabaseClient; user: User }> {
  const { db, user } = await currentUser();
  if (!user) redirect('/admin/login');
  if (!(await isAdmin(db))) redirect('/admin/no-autorizado');
  return { db, user };
}

export class NotAuthorizedError extends Error {
  constructor() {
    super('Tu sesión terminó o no tienes permiso. Vuelve a iniciar sesión.');
  }
}

/** Server Actions del panel: solo el propietario. */
export async function requireAdminAction(): Promise<SupabaseClient> {
  const { db, user } = await currentUser();
  if (!user || !(await isAdmin(db))) throw new NotAuthorizedError();
  return db;
}

/** Páginas de "Mi cuenta": exige sesión. */
export async function requireCustomerPage(next = '/cuenta'): Promise<{ db: SupabaseClient; user: User }> {
  const { db, user } = await currentUser();
  if (!user) redirect(`/cuenta/ingresar?next=${encodeURIComponent(next)}`);
  return { db, user };
}

/** Server Actions de "Mi cuenta". */
export async function requireCustomerAction(): Promise<{ db: SupabaseClient; user: User }> {
  const { db, user } = await currentUser();
  if (!user) throw new Error('Tu sesión terminó. Vuelve a entrar a tu cuenta.');
  return { db, user };
}
