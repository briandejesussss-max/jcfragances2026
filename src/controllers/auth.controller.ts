'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface LoginState {
  error?: string;
}

/** Inicio de sesión del propietario con Supabase Auth (correo y contraseña). */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/admin');
  if (!email || !password) return { error: 'Escribe tu correo y contraseña' };

  const db = await createSupabaseServerClient();
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) return { error: 'Correo o contraseña incorrectos' };

  redirect(next.startsWith('/admin') ? next : '/admin');
}

export async function logout(): Promise<void> {
  const db = await createSupabaseServerClient();
  await db.auth.signOut();
  redirect('/admin/login');
}
