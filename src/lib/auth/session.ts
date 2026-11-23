import 'server-only';

import { redirect } from 'next/navigation';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/** Usuario del panel (sesión de Supabase Auth) o null. getUser() valida el token con Supabase. */
export async function getAdminUser(): Promise<User | null> {
  const db = await createSupabaseServerClient();
  const { data } = await db.auth.getUser();
  return data.user ?? null;
}

/** Para páginas del panel: redirige al login si no hay sesión. */
export async function requireAdminPage(): Promise<{ db: SupabaseClient; user: User }> {
  const db = await createSupabaseServerClient();
  const { data } = await db.auth.getUser();
  if (!data.user) redirect('/admin/login');
  return { db, user: data.user };
}

export class NotAuthorizedError extends Error {
  constructor() {
    super('Tu sesión terminó. Vuelve a iniciar sesión.');
  }
}

/** Para Server Actions del panel: lanza un error si no hay sesión. */
export async function requireAdminAction(): Promise<SupabaseClient> {
  const db = await createSupabaseServerClient();
  const { data } = await db.auth.getUser();
  if (!data.user) throw new NotAuthorizedError();
  return db;
}
