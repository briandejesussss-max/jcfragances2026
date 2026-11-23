import { normalizeText } from '@/lib/utils/slug';

/** Direcciones de México: estados y búsqueda de código postal. */

const STATES: Record<string, string> = {
  ags: 'Aguascalientes', bc: 'Baja California', bcs: 'Baja California Sur', camp: 'Campeche', chis: 'Chiapas',
  chih: 'Chihuahua', cdmx: 'Ciudad de México', df: 'Ciudad de México', coah: 'Coahuila', col: 'Colima', dgo: 'Durango',
  gto: 'Guanajuato', gro: 'Guerrero', hgo: 'Hidalgo', jal: 'Jalisco', mex: 'Estado de México', edomex: 'Estado de México',
  mich: 'Michoacán', mor: 'Morelos', nay: 'Nayarit', nl: 'Nuevo León', oax: 'Oaxaca', pue: 'Puebla', qro: 'Querétaro',
  qroo: 'Quintana Roo', slp: 'San Luis Potosí', sin: 'Sinaloa', son: 'Sonora', tab: 'Tabasco', tamps: 'Tamaulipas',
  tlax: 'Tlaxcala', ver: 'Veracruz', yuc: 'Yucatán', zac: 'Zacatecas',
};

const BY_NAME: Record<string, string> = {};
Object.values(STATES).forEach((n) => (BY_NAME[normalizeText(n)] = n));
BY_NAME[normalizeText('Coahuila de Zaragoza')] = 'Coahuila';
BY_NAME[normalizeText('Veracruz de Ignacio de la Llave')] = 'Veracruz';
BY_NAME[normalizeText('Michoacán de Ocampo')] = 'Michoacán';
BY_NAME[normalizeText('México')] = 'Estado de México';

export const MEXICAN_STATES = Array.from(new Set(Object.values(STATES))).sort((a, b) => a.localeCompare(b, 'es'));

/** Nombre oficial del estado a partir de su abreviatura o nombre largo. */
export const stateName = (s: string) => STATES[normalizeText(s)] || BY_NAME[normalizeText(s)] || '';

export interface ZipInfo {
  state: string;
  city: string;
  colonias: string[];
}

const uniq = (a: unknown[]) => [...new Set(a.filter(Boolean).map((s) => String(s).trim()))];

async function fetchJson(url: string, ms = 6000): Promise<unknown> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

type Json = Record<string, unknown>;
const pick = (o: Json | undefined, ...keys: string[]) => {
  for (const k of keys) if (o && o[k]) return String(o[k]);
  return '';
};

/** Busca estado, municipio y colonias de un C.P. en servicios públicos (con respaldos). */
export async function lookupZip(cp: string): Promise<ZipInfo | null> {
  if (!/^\d{5}$/.test(cp)) return null;
  const tries: Array<() => Promise<ZipInfo | null>> = [
    async () => {
      const j = (await fetchJson(`https://sepomex.icalialabs.com/api/v1/zip_codes?zip_code=${cp}&per_page=100`)) as { zip_codes?: Json[] };
      const z = j?.zip_codes ?? [];
      if (!z.length) return null;
      return { state: pick(z[0], 'd_estado', 'D_estado'), city: pick(z[0], 'd_mnpio', 'D_mnpio', 'd_ciudad'), colonias: uniq(z.map((o) => pick(o, 'd_asenta', 'D_asenta'))) };
    },
    async () => {
      const j = (await fetchJson(`https://api.zippopotam.us/mx/${cp}`)) as { places?: Json[] };
      const pl = j?.places ?? [];
      if (!pl.length) return null;
      return { state: pick(pl[0], 'state'), city: '', colonias: uniq(pl.map((x) => x['place name'])) };
    },
  ];
  for (const t of tries) {
    try {
      const r = await t();
      if (r && (r.state || r.city || r.colonias.length)) return { ...r, state: stateName(r.state) || r.state };
    } catch {
      // probar el siguiente servicio
    }
  }
  return null;
}
