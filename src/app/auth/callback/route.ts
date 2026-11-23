import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Controlador HTTP de regreso de Supabase Auth: confirmación de correo, enlace mágico,
 * recuperación de contraseña y Google. Crea la sesión y lleva al cliente a su cuenta.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const nextParam = url.searchParams.get('next') ?? '/cuenta';
  const next = nextParam.startsWith('/cuenta') ? nextParam : '/cuenta';
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;

  const db = await createSupabaseServerClient();
  let ok = false;
  if (code) ok = !(await db.auth.exchangeCodeForSession(code)).error;
  else if (tokenHash && type) ok = !(await db.auth.verifyOtp({ type, token_hash: tokenHash })).error;

  const dest = request.nextUrl.clone();
  dest.search = '';
  if (ok) {
    dest.pathname = type === 'recovery' ? '/cuenta/nueva-contrasena' : next;
  } else {
    dest.pathname = '/cuenta/ingresar';
    dest.searchParams.set('error', 'enlace');
  }
  return NextResponse.redirect(dest);
}
