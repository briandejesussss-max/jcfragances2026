'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireCustomerAction } from '@/lib/auth/session';
import { siteUrl } from '@/lib/services/email';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getProfile, saveProfile } from '@/models/repositories/profile.repository';
import type { ActionResult, Customer, CustomerProfile } from '@/models/types';
import { runAction, UserError } from './action-result';

/** Cuentas de cliente: registro, las tres formas de entrar, recuperar contraseña y perfil. */

export interface FormState {
  error?: string;
  message?: string;
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const isEmail = (s: string) => /^\S+@\S+\.\S+$/.test(s);
const safeNext = (n: string | null | undefined, fallback = '/cuenta') => (n && n.startsWith('/cuenta') ? n : fallback);

async function origin() {
  const h = await headers();
  return siteUrl(h.get('origin') ?? (h.get('host') ? `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}` : null));
}

const callbackUrl = async (next: string) => `${await origin()}/auth/callback?next=${encodeURIComponent(next)}`;

/** Traduce los errores más comunes de Supabase Auth. */
function authMessage(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos';
  if (m.includes('email not confirmed')) return 'Primero confirma tu correo: revisa tu bandeja de entrada (y spam).';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Ese correo ya tiene cuenta. Entra o recupera tu contraseña.';
  if (m.includes('pwned') || m.includes('leaked') || m.includes('weak')) return 'Esa contraseña es muy débil o apareció en filtraciones. Elige otra.';
  if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 8 caracteres';
  if (m.includes('rate limit') || m.includes('too many')) return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
  if (m.includes('signups not allowed') || m.includes('signup is disabled')) return 'El registro de cuentas aún no está activo.';
  if (m.includes('provider is not enabled') || m.includes('unsupported provider')) return 'Entrar con Google aún no está activo. Usa tu correo.';
  return 'No se pudo completar. Inténtalo de nuevo.';
}

export async function signUpAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const name = str(fd, 'name');
  const email = str(fd, 'email').toLowerCase();
  const password = String(fd.get('password') ?? '');
  const notify = fd.get('notify') === 'on';
  if (!name) return { error: 'Escribe tu nombre' };
  if (!isEmail(email)) return { error: 'Escribe un correo válido' };
  if (password.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres' };

  const db = await createSupabaseServerClient();
  const { data, error } = await db.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: await callbackUrl('/cuenta/bienvenida'), data: { name, notify_email: notify } },
  });
  if (error) return { error: authMessage(error.message) };
  if (data.session) redirect('/cuenta/bienvenida');
  redirect(`/cuenta/revisa-tu-correo?email=${encodeURIComponent(email)}`);
}

export async function passwordLoginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, 'email').toLowerCase();
  const password = String(fd.get('password') ?? '');
  if (!isEmail(email) || !password) return { error: 'Escribe tu correo y contraseña' };
  const db = await createSupabaseServerClient();
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) return { error: authMessage(error.message) };
  redirect(safeNext(str(fd, 'next')));
}

/** Enlace mágico: entra sin contraseña (crea la cuenta si no existe). */
export async function magicLinkAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, 'email').toLowerCase();
  if (!isEmail(email)) return { error: 'Escribe un correo válido' };
  const db = await createSupabaseServerClient();
  const { error } = await db.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: await callbackUrl(safeNext(str(fd, 'next'), '/cuenta/bienvenida')), shouldCreateUser: true },
  });
  if (error) return { error: authMessage(error.message) };
  redirect(`/cuenta/revisa-tu-correo?email=${encodeURIComponent(email)}&tipo=enlace`);
}

export async function googleLoginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const db = await createSupabaseServerClient();
  const { data, error } = await db.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: await callbackUrl(safeNext(str(fd, 'next'), '/cuenta/bienvenida')) },
  });
  if (error || !data.url) return { error: authMessage(error?.message ?? 'provider is not enabled') };
  redirect(data.url);
}

export async function resendConfirmationAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, 'email').toLowerCase();
  if (!isEmail(email)) return { error: 'Correo no válido' };
  const db = await createSupabaseServerClient();
  const { error } = await db.auth.resend({ type: 'signup', email, options: { emailRedirectTo: await callbackUrl('/cuenta/bienvenida') } });
  if (error) return { error: authMessage(error.message) };
  return { message: 'Te reenviamos el correo ✓' };
}

export async function requestPasswordResetAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, 'email').toLowerCase();
  if (!isEmail(email)) return { error: 'Escribe un correo válido' };
  const db = await createSupabaseServerClient();
  const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: await callbackUrl('/cuenta/nueva-contrasena') });
  if (error && !error.message.toLowerCase().includes('not found')) return { error: authMessage(error.message) };
  // Mismo mensaje exista o no la cuenta, para no revelar qué correos están registrados.
  return { message: 'Si ese correo tiene cuenta, te enviamos un enlace para crear una nueva contraseña.' };
}

export async function updatePasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const password = String(fd.get('password') ?? '');
  if (password.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres' };
  if (password !== String(fd.get('confirm') ?? '')) return { error: 'Las contraseñas no coinciden' };
  const db = await createSupabaseServerClient();
  const { error } = await db.auth.updateUser({ password });
  if (error) return { error: authMessage(error.message) };
  redirect('/cuenta?contrasena=ok');
}

export async function customerLogoutAction(): Promise<void> {
  const db = await createSupabaseServerClient();
  await db.auth.signOut();
  redirect('/');
}

const clean = (v: unknown, max = 160) => String(v ?? '').trim().slice(0, max);

export async function saveProfileAction(input: Pick<CustomerProfile, 'name' | 'phone' | 'address' | 'notifyEmail'>): Promise<ActionResult> {
  return runAction(async () => {
    const { db, user } = await requireCustomerAction();
    const name = clean(input.name);
    if (!name) throw new UserError('Escribe tu nombre');
    const a = (input.address ?? {}) as Partial<Customer>;
    const address: Partial<Customer> = {
      street: clean(a.street),
      numExt: clean(a.numExt, 20),
      numInt: clean(a.numInt, 20),
      cp: clean(a.cp, 5).replace(/\D/g, ''),
      colonia: clean(a.colonia),
      city: clean(a.city),
      state: clean(a.state),
    };
    await saveProfile(db, { id: user.id, name, phone: clean(input.phone, 20), address, notifyEmail: !!input.notifyEmail });
    return undefined;
  });
}

/** Datos para precargar el formulario de compra cuando el cliente tiene sesión. */
export async function getCheckoutDefaultsAction(): Promise<Partial<Customer> | null> {
  const db = await createSupabaseServerClient();
  const { data } = await db.auth.getUser();
  if (!data.user) return null;
  const p = await getProfile(db, data.user.id).catch(() => null);
  return { ...(p?.address ?? {}), name: p?.name || '', phone: p?.phone || '', email: data.user.email ?? '' };
}
