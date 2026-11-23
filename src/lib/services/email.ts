import 'server-only';

/**
 * Envío de correos transaccionales con Resend (https://resend.com).
 * Si faltan RESEND_API_KEY o EMAIL_FROM, no envía nada y responde "not_configured":
 * el resto de la tienda funciona igual.
 */
export type EmailResult = 'sent' | 'not_configured' | 'failed';

export async function sendEmail(input: { to: string; subject: string; html: string; text: string }): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return 'not_configured';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html, text: input.text }),
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('[email]', res.status, await res.text().catch(() => ''));
      return 'failed';
    }
    return 'sent';
  } catch (e) {
    console.error('[email]', e);
    return 'failed';
  }
}

/** URL pública del sitio para enlaces en correos y redirecciones de inicio de sesión. */
export function siteUrl(origin?: string | null): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  return (origin || fromEnv || 'http://localhost:3000').replace(/\/$/, '');
}
