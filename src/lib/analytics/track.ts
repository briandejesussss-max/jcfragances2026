'use client';

import { supabaseEnv } from '@/lib/supabase/env';

/**
 * Estadísticas propias y anónimas: un identificador aleatorio por navegador
 * (sin nombre, correo ni IP). Los eventos se envían a la función track_event
 * de Supabase; si algo falla se ignora para no afectar la tienda.
 */
export type TrackType = 'page_view' | 'product_view' | 'add_to_cart' | 'checkout_start' | 'order_placed' | 'whatsapp_click';

const VISITOR_KEY = 'jf26_visitor';
const SOURCE_KEY = 'jf26_source';
export const OPT_OUT_KEY = 'jf26_no_stats';

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export const isOptedOut = () => safe(() => localStorage.getItem(OPT_OUT_KEY) === '1', false);

export function setOptOut(off: boolean) {
  safe(() => (off ? localStorage.setItem(OPT_OUT_KEY, '1') : localStorage.removeItem(OPT_OUT_KEY)), undefined);
}

export function visitorId(): string | null {
  return safe(() => {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID().replace(/-/g, '');
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  }, null);
}

const REFERRERS: Array<[RegExp, string]> = [
  [/instagram\./, 'instagram'],
  [/(facebook\.|fb\.)/, 'facebook'],
  [/tiktok\./, 'tiktok'],
  [/(whatsapp\.|wa\.me)/, 'whatsapp'],
  [/google\./, 'google'],
  [/(bing\.|duckduckgo\.|yahoo\.)/, 'buscador'],
  [/(t\.co|twitter\.|x\.com)/, 'x'],
];

/** Origen de la visita: ?utm_source=…, o el sitio de donde llegó, o "directo". Se fija una vez por sesión. */
function visitSource(): string {
  return safe(() => {
    const saved = sessionStorage.getItem(SOURCE_KEY);
    if (saved) return saved;
    const utm = new URLSearchParams(location.search).get('utm_source')?.trim().toLowerCase();
    let source = utm ? utm.slice(0, 30) : 'directo';
    if (!utm && document.referrer) {
      const host = safe(() => new URL(document.referrer).hostname, '');
      if (host && host !== location.hostname) source = REFERRERS.find(([re]) => re.test(host))?.[1] ?? host.replace(/^www\./, '').slice(0, 30);
    }
    sessionStorage.setItem(SOURCE_KEY, source);
    return source;
  }, 'directo');
}

export function track(type: TrackType, fragranceId?: string | null) {
  if (typeof window === 'undefined' || isOptedOut()) return;
  const visitor = visitorId();
  if (!visitor) return;
  const env = safe(() => supabaseEnv(), null);
  if (!env) return;
  const { url, key } = env;
  void fetch(`${url}/rest/v1/rpc/track_event`, {
    method: 'POST',
    keepalive: true,
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      p_visitor: visitor,
      p_type: type,
      p_fragrance_id: fragranceId ?? null,
      p_path: location.pathname.slice(0, 200),
      p_source: visitSource(),
    }),
  }).catch(() => {});
}
