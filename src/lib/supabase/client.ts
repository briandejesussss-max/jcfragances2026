'use client';

import { createBrowserClient } from '@supabase/ssr';
import { supabaseEnv } from './env';

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

/** Cliente para componentes de cliente (subida de fotos del panel). Comparte la sesión por cookies. */
export function createSupabaseBrowserClient() {
  if (!browserClient) {
    const { url, key } = supabaseEnv();
    browserClient = createBrowserClient(url, key);
  }
  return browserClient;
}
