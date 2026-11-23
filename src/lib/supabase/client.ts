'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseEnv } from './env';

let browserClient: SupabaseClient | undefined;

/** Cliente para componentes de cliente (subida de fotos del panel). Comparte la sesión por cookies. */
export function createSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    const { url, key } = supabaseEnv();
    browserClient = createBrowserClient(url, key);
  }
  return browserClient;
}
