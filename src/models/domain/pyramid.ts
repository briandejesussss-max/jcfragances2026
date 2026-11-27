import type { Fragrance, Pyramid, PyramidNote, PyramidSection } from '../types';

/** Pirámide olfativa: notas por sección con foto o emoji de respaldo. */

export const PYRAMID_SECTIONS: PyramidSection[] = ['top', 'mid', 'base'];

export const PYRAMID_SECTION_LABEL: Record<PyramidSection, string> = { top: 'Salida', mid: 'Corazón', base: 'Fondo' };

export const PYRAMID_DEFAULT_EMOJI: Record<PyramidSection, string> = { top: '🌿', mid: '🌸', base: '🪵' };

const IMG_BANK: Array<[RegExp, string]> = [
  [/bergamota|lim[oó]n|lima\b|yuzu|c[ií]trico/i, 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=240&q=75'],
  [/naranja|mandarina|neroli|toronja|pomelo/i, 'https://images.unsplash.com/photo-1547514701-42782101795e?w=240&q=75'],
  [/manzana/i, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=240&q=75'],
  [/pi[ñn]a|mango|maracuy/i, 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=240&q=75'],
  [/cereza|fresa|frambuesa|frutos rojos|grosella/i, 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=240&q=75'],
  [/durazno|melocot/i, 'https://images.unsplash.com/photo-1629828874514-c1e5103f2150?w=240&q=75'],
  [/lavanda|violeta|iris/i, 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=240&q=75'],
  [/rosa\b|rosas/i, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=240&q=75'],
  [/jazm[ií]n|azahar|tuberosa|flor|peon[ií]a|lirio|magnolia/i, 'https://images.unsplash.com/photo-1508784411316-02b8cd4d3a3a?w=240&q=75'],
  [/vainilla/i, 'https://images.unsplash.com/photo-1631209121750-a9f656d28f46?w=240&q=75'],
  [/canela|especia|cardamomo|clavo|nuez moscada/i, 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=240&q=75'],
  [/caf[eé]/i, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=240&q=75'],
  [/cacao|chocolate|pralin/i, 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=240&q=75'],
  [/miel|caramelo/i, 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=240&q=75'],
  [/coco\b/i, 'https://images.unsplash.com/photo-1580984969071-a8da5656c2fb?w=240&q=75'],
  [/almendra|avellana|nuez|pistache|tonka/i, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=240&q=75'],
  [/s[aá]ndalo|cedro|madera|oud|vetiver|pachul[ií]|roble/i, 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=240&q=75'],
  [/[aá]mbar|ambroxan|resina|incienso|mirra/i, 'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?w=240&q=75'],
  [/tabaco|cuero|gamuza/i, 'https://images.unsplash.com/photo-1527195575508-5b138d14a35b?w=240&q=75'],
  [/menta|albahaca|romero|salvia|hoja|t[eé]|musgo/i, 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=240&q=75'],
  [/pimienta|jengibre/i, 'https://images.unsplash.com/photo-1599909533681-74046c648d7e?w=240&q=75'],
  [/marin|agua|acu[aá]tic|sal\b|brisa/i, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=240&q=75'],
  [/almizcle|musk/i, 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=240&q=75'],
];

const EMOJI_BANK: Array<[RegExp, string]> = [
  [/bergamota|lim[oó]n|lima\b|c[ií]trico|yuzu|toronja|pomelo/i, '🍋'],
  [/naranja|mandarina|neroli/i, '🍊'],
  [/manzana/i, '🍎'],
  [/pi[ñn]a|mango|maracuy/i, '🍍'],
  [/pera\b/i, '🍐'],
  [/durazno|melocot|albaricoque/i, '🍑'],
  [/fresa|frambuesa|cereza|grosella|zarzamora|frutos rojos/i, '🍓'],
  [/lavanda|violeta|iris/i, '💜'],
  [/rosa/i, '🌹'],
  [/jazm[ií]n|azahar|tuberosa|ylang|gardenia/i, '🌼'],
  [/flor|peon[ií]a|lirio|magnolia|orqu[ií]dea/i, '🌸'],
  [/caf[eé]/i, '☕'],
  [/cacao|chocolate/i, '🍫'],
  [/miel/i, '🍯'],
  [/coco/i, '🥥'],
  [/vainilla/i, '🍦'],
  [/caramelo|prelin[eé]|praline|az[uú]car/i, '🍬'],
  [/almendra|avellana|nuez|pistache/i, '🌰'],
  [/habas? tonka|tonka/i, '🫘'],
  [/s[aá]ndalo|cedro|madera|vetiver|pachul[ií]|oud|roble|ciprés|cipres/i, '🪵'],
  [/[aá]mbar|ambroxan|ambr[eé]/i, '🟠'],
  [/almizcle|musk|algod[oó]n/i, '🤍'],
  [/incienso|mirra|humo|resina/i, '💨'],
  [/cuero|gamuza/i, '🟤'],
  [/tabaco|canela|clavo|cardamomo|nuez moscada|especia/i, '🍂'],
  [/pimienta|jengibre|chile/i, '🌶️'],
  [/menta|hierbabuena|albahaca|salvia|romero|tomillo|hoja|hierba|t[eé] verde|musgo/i, '🌿'],
  [/t[eé]\b/i, '🍵'],
  [/marin|agua|acu[aá]tic|oc[eé]ano|sal\b|brisa/i, '🌊'],
  [/vodka|ron\b|whisky|co[ñn]ac|licor/i, '🥃'],
];

export function guessEmoji(text: string, section: PyramidSection): string {
  for (const [re, e] of EMOJI_BANK) if (re.test(text)) return e;
  return PYRAMID_DEFAULT_EMOJI[section];
}

export function guessImage(text: string): string {
  for (const [re, url] of IMG_BANK) if (re.test(text)) return url;
  return '';
}

export const emptyPyramid = (): Pyramid => ({ top: [], mid: [], base: [] });

export const hasPyramid = (py: Pyramid | undefined): py is Pyramid =>
  !!py && PYRAMID_SECTIONS.some((s) => (py[s] ?? []).length > 0);

/** Texto plano con todas las notas, separado por comas. */
export const composePyramid = (py: Pyramid | undefined) =>
  py ? PYRAMID_SECTIONS.flatMap((s) => (py[s] ?? []).map((n) => n.t)).join(', ') : '';

const toNotes = (str: string, section: PyramidSection): PyramidNote[] =>
  str
    .split(/[,;•\n]/)
    .map((x) => x.trim().replace(/[.\s]+$/, ''))
    .filter(Boolean)
    .map((t) => ({ e: guessEmoji(t, section), t, img: guessImage(t) }));

/**
 * Pirámide para mostrar: la guardada o, si no hay, la que se deduce del texto de notas
 * ("Salida: ... Corazón: ... Fondo: ..." o una lista repartida en tercios).
 * Con `strict` devuelve null si el texto no trae secciones.
 */
export function pyramidFor(f: Pick<Fragrance, 'pyramid' | 'notes'>, strict = false): Pyramid | null {
  if (hasPyramid(f.pyramid)) return { top: f.pyramid.top ?? [], mid: f.pyramid.mid ?? [], base: f.pyramid.base ?? [] };
  const text = (f.notes ?? '').trim();
  const out = emptyPyramid();
  const re = /(salida|cabeza|coraz[oó]n|fondo|base)\s*[:\-–]\s*([\s\S]*?)(?=(?:salida|cabeza|coraz[oó]n|fondo|base)\s*[:\-–]|$)/gi;
  let m: RegExpExecArray | null;
  let found = false;
  while ((m = re.exec(text))) {
    const k: PyramidSection = /salida|cabeza/i.test(m[1]) ? 'top' : /coraz/i.test(m[1]) ? 'mid' : 'base';
    out[k] = out[k].concat(toNotes(m[2], k));
    found = true;
  }
  if (found) return out;
  if (strict) return null;

  const parts = text ? toNotes(text, 'top') : [];
  const n = parts.length;
  if (n === 0) return out;
  if (n < 3) {
    out.top = parts.slice(0, 1);
    out.mid = parts.slice(1, 2).map((p) => ({ ...p, e: guessEmoji(p.t, 'mid') }));
    return out;
  }
  const a = Math.ceil(n / 3);
  const b = Math.ceil((n - a) / 2);
  out.top = parts.slice(0, a);
  out.mid = parts.slice(a, a + b).map((p) => ({ ...p, e: guessEmoji(p.t, 'mid') }));
  out.base = parts.slice(a + b).map((p) => ({ ...p, e: guessEmoji(p.t, 'base') }));
  return out;
}

export interface CompactNotesSection {
  /** Nombre de la sección (Salida, Corazón, Fondo…) o vacío si el texto no trae secciones */
  title: string;
  /** Notas de la sección, ya separadas */
  notes: string[];
}

const SECTION_LINE = /^(?:[^\p{L}]*)(notas?\s+de\s+)?(salida|cabeza|coraz[oó]n|fondo|base)\b[\s:.\-–]*(?:\([^)]*\))?[\s:.\-–]*$/iu;
const sectionTitle = (s: string) => {
  const k = s.toLowerCase();
  if (/salida|cabeza/.test(k)) return 'Salida';
  if (/coraz/.test(k)) return 'Corazón';
  return 'Fondo';
};

/**
 * Convierte el texto libre de notas (un renglón por nota, viñetas, "·"…) en secciones con notas
 * separadas, para mostrarlo compacto con comas en pantallas chicas.
 */
export function compactNotes(text: string): CompactNotesSection[] {
  const out: CompactNotesSection[] = [];
  let current: CompactNotesSection = { title: '', notes: [] };
  const push = () => current.notes.length && out.push(current);

  // Varias secciones en un solo renglón ("Salida: … Corazón: …"): se separan en renglones.
  const normalized = String(text ?? '').replace(/[.;,]?\s*((?:notas?\s+de\s+)?(?:salida|cabeza|coraz[oó]n|fondo|base)\s*[:\-–])/giu, '\n$1');
  for (const raw of normalized.split(/\n+/)) {
    const line = raw.trim();
    if (!line) continue;
    const header = line.match(SECTION_LINE);
    // "Notas de salida: a, b" en un solo renglón
    const inline = header ? null : line.match(/^(?:[^\p{L}]*)(?:notas?\s+de\s+)?(salida|cabeza|coraz[oó]n|fondo|base)\s*[:\-–]\s*(.+)$/iu);
    if (header || inline) {
      push();
      current = { title: sectionTitle(header ? header[2] : (inline as RegExpMatchArray)[1]), notes: [] };
      if (!inline) continue;
    }
    const body = inline ? inline[2] : line;
    for (const part of body.split(/\s*[·•,;]\s*/)) {
      const note = part.replace(/^[-*–\s]+/, '').replace(/[.\s]+$/, '').trim();
      if (note && /\p{L}/u.test(note)) current.notes.push(note);
    }
  }
  push();

  // Secciones repetidas (texto pegado dos veces): se juntan y se quitan notas duplicadas.
  const merged: CompactNotesSection[] = [];
  for (const sec of out) {
    const same = merged.find((m) => m.title === sec.title);
    const target = same ?? (merged.push({ title: sec.title, notes: [] }), merged[merged.length - 1]);
    for (const n of sec.notes) if (!target.notes.includes(n)) target.notes.push(n);
  }
  return merged;
}

/** "TORONJA" / "toronja" → "Toronja" (las notas a veces se capturan en mayúsculas). */
const niceNote = (t: string) => {
  const s = t.trim().replace(/\s+/g, ' ');
  const lower = s === s.toUpperCase() ? s.toLowerCase() : s;
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

/** Notas de una etapa en una frase corta: "Toronja y bergamota", "Cedro, ámbar y 3 más". */
export function notesPhrase(notes: { t: string }[], max = 2): string {
  const names = [...new Set(notes.map((n) => niceNote(n.t)).filter(Boolean))];
  if (!names.length) return '';
  const shown = names.slice(0, max).map((n, i) => (i === 0 ? n : n.charAt(0).toLowerCase() + n.slice(1)));
  const rest = names.length - shown.length;
  if (rest > 0) return `${shown.join(', ')} y ${rest} más`;
  return shown.length > 1 ? `${shown.slice(0, -1).join(', ')} y ${shown.at(-1)}` : shown[0];
}
