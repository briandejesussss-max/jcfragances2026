import 'server-only';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { supabaseEnv } from './env';

/**
 * Cliente con la sesión del usuario (cookies). Úsalo en Server Components,
 * Server Actions y Route Handlers que necesiten saber quién está conectado.
 */
export async function createSupabaseServerClient() {
  const { url, key } = supabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Llamado desde un Server Component: el proxy ya refresca la sesión.
        }
      },
    },
  });
}

/**
 * Cliente anónimo sin cookies. Sirve para lecturas públicas que se pueden
 * cachear (catálogo, datos de la tienda) y para las funciones RPC públicas.
 */
export function createSupabasePublicClient() {
  const { url, key } = supabaseEnv();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
