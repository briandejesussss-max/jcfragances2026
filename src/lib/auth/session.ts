import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Sesiones. Propietario y clientes usan el mismo Supabase Auth; el propietario se distingue
 * porque está en la tabla `admins` (función `is_admin()`). La base de datos aplica la misma regla.
 *
 * Rendimiento: la sesión se verifica UNA vez por petición (React `cache`) y con `getClaims()`,
 * que valida la firma del token en el servidor (llaves ES256) sin ir a Supabase en cada clic.
 */

export interface SessionUser {
  id: string;
  email: string;
  /** Formas de entrar ligadas a la cuenta (email, google…) */
  providers: string[];
}

type Session = { db: SupabaseClient; user: SessionUser | null };

const getSession = cache(async (): Promise<Session> => {
  const db = await createSupabaseServerClient();
  const { data, error } = await db.auth.getClaims();
  const claims = !error ? data?.claims : null;
  if (!claims?.sub) return { db, user: null };
  const meta = (claims.app_metadata ?? {}) as { provider?: string; providers?: string[] };
  return {
    db,
    user: {
      id: claims.sub,
      email: String(claims.email ?? ''),
      providers: meta.providers ?? (meta.provider ? [meta.provider] : ['email']),
    },
  };
});

const getIsAdmin = cache(async (): Promise<boolean> => {
  const { db, user } = await getSession();
  if (!user) return false;
  const { data, error } = await db.rpc('is_admin');
  return !error && data === true;
});

/** Usuario con sesión (cliente o propietario) o null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  return (await getSession()).user;
}

/** Páginas del panel: sin sesión → login; con sesión de cliente → "No autorizado". */
export async function requireAdminPage(): Promise<{ db: SupabaseClient; user: SessionUser }> {
  const { db, user } = await getSession();
  if (!user) redirect('/admin/login');
  if (!(await getIsAdmin())) redirect('/admin/no-autorizado');
  return { db, user };
}

export class NotAuthorizedError extends Error {
  constructor() {
    super('Tu sesión terminó o no tienes permiso. Vuelve a iniciar sesión.');
  }
}

/** Server Actions del panel: solo el propietario. */
export async function requireAdminAction(): Promise<SupabaseClient> {
  const { db, user } = await getSession();
  if (!user || !(await getIsAdmin())) throw new NotAuthorizedError();
  return db;
}

/** Páginas de "Mi cuenta": exige sesión. */
export async function requireCustomerPage(next = '/cuenta'): Promise<{ db: SupabaseClient; user: SessionUser }> {
  const { db, user } = await getSession();
  if (!user) redirect(`/cuenta/ingresar?next=${encodeURIComponent(next)}`);
  return { db, user };
}

/** Server Actions de "Mi cuenta". */
export async function requireCustomerAction(): Promise<{ db: SupabaseClient; user: SessionUser }> {
  const { db, user } = await getSession();
  if (!user) throw new Error('Tu sesión terminó. Vuelve a entrar a tu cuenta.');
  return { db, user };
}
