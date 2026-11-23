import 'server-only';

import { supabaseEnv } from '@/lib/supabase/env';

/** Qué formas de entrar tiene activadas el proyecto de Supabase (endpoint público, cacheado 5 min). */
export interface AuthSettings {
  signupEnabled: boolean;
  googleEnabled: boolean;
}

export async function getAuthSettings(): Promise<AuthSettings> {
  try {
    const { url, key } = supabaseEnv();
    const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key }, next: { revalidate: 300, tags: ['auth-settings'] } });
    if (!res.ok) throw new Error(String(res.status));
    const d = (await res.json()) as { disable_signup?: boolean; external?: Record<string, boolean> };
    return { signupEnabled: !d.disable_signup, googleEnabled: !!d.external?.google };
  } catch {
    return { signupEnabled: true, googleEnabled: false };
  }
}
