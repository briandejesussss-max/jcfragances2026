import 'server-only';

import { supabaseEnv } from '@/lib/supabase/env';

/** Qué formas de entrar tiene activadas el proyecto de Supabase (endpoint público, cacheado 5 min). */
export interface AuthSettings {
  signupEnabled: boolean;
  googleEnabled: boolean;
  /** Supabase pide confirmar el correo (requiere SMTP propio con dominio) */
  emailConfirmation: boolean;
  /** Avisos por correo de cambio de etapa (RESEND_API_KEY y EMAIL_FROM configurados) */
  emailNotifications: boolean;
}

const emailNotificationsOn = () => !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

export async function getAuthSettings(): Promise<AuthSettings> {
  try {
    const { url, key } = supabaseEnv();
    const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key }, next: { revalidate: 300, tags: ['auth-settings'] } });
    if (!res.ok) throw new Error(String(res.status));
    const d = (await res.json()) as { disable_signup?: boolean; mailer_autoconfirm?: boolean; external?: Record<string, boolean> };
    return {
      signupEnabled: !d.disable_signup,
      googleEnabled: !!d.external?.google,
      emailConfirmation: !d.mailer_autoconfirm,
      emailNotifications: emailNotificationsOn(),
    };
  } catch {
    return { signupEnabled: true, googleEnabled: false, emailConfirmation: false, emailNotifications: emailNotificationsOn() };
  }
}
