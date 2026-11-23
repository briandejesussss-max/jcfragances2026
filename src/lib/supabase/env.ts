/**
 * Variables públicas de Supabase. Ambas viajan al navegador: la seguridad
 * la imponen las políticas RLS de cada tabla, no el secreto de la clave.
 */
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Revisa .env.local o las variables del proyecto en Vercel.',
    );
  }
  return { url, key };
}
