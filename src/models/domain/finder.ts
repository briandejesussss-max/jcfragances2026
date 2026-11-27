import type { Fragrance, FragranceSummary, SizeConfig } from '../types';
import { FAMILY_BY_KEY, familiesOf, plain, type FamilyKey } from './families';
import { profileOf } from './profile';
import { BOTTLE, sizeState } from './sizes';

/**
 * "Encuentra tu perfume": 6 preguntas → los perfumes que mejor encajan, con el porqué.
 * Solo usa datos que cada perfume ya tiene (género, notas, clima, ocasión, precios).
 */

export type Style = 'masc' | 'fem' | 'any';
export type Use = 'dia' | 'noche' | 'todo' | 'cita';
export type Climate = 'calor' | 'frio' | 'todo';
export type Format = 'botella' | 'decant' | 'ambos';
export type When = 'ya' | 'espero';

export interface FinderAnswers {
  style?: Style;
  /** Hasta 2; vacío = "Sorpréndeme" */
  families?: FamilyKey[];
  use?: Use;
  climate?: Climate;
  format?: Format;
  when?: When;
}

export interface FinderOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

export const STYLE_OPTIONS: FinderOption<Style>[] = [
  { value: 'masc', label: 'Más masculino' },
  { value: 'fem', label: 'Más femenino' },
  { value: 'any', label: 'Unisex o me da igual', hint: 'Te mostramos todos' },
];
export const USE_OPTIONS: FinderOption<Use>[] = [
  { value: 'dia', label: 'De día', hint: 'Oficina, escuela y el diario' },
  { value: 'noche', label: 'De noche', hint: 'Cenas, fiestas y salidas' },
  { value: 'todo', label: 'Para todo', hint: 'Uno que funcione siempre' },
  { value: 'cita', label: 'Para una cita', hint: 'Envolvente, para estar cerca' },
];
export const CLIMATE_OPTIONS: FinderOption<Climate>[] = [
  { value: 'calor', label: 'Con calor', hint: 'Primavera y verano' },
  { value: 'frio', label: 'Con frío', hint: 'Otoño e invierno' },
  { value: 'todo', label: 'Todo el año', hint: 'No importa la temporada' },
];
export const FORMAT_OPTIONS: FinderOption<Format>[] = [
  { value: 'decant', label: 'En decant', hint: 'Pruébalo en 3, 5 o 10 ml' },
  { value: 'botella', label: 'Botella completa', hint: 'El frasco entero' },
  { value: 'ambos', label: 'Muéstrame los dos' },
];
export const WHEN_OPTIONS: FinderOption<When>[] = [
  { value: 'ya', label: 'Lo quiero ya', hint: 'Solo lo que está listo para enviar' },
  { value: 'espero', label: 'Puedo esperar', hint: 'También los que pedimos especialmente para ti' },
];

export const FINDER_STEPS = ['style', 'families', 'use', 'climate', 'format', 'when'] as const;
export type FinderStep = (typeof FINDER_STEPS)[number];

/* ---------- Lectura del perfil de cada perfume ---------- */

const has = (text: string, re: RegExp) => re.test(plain(text));

export function climateOf(f: Pick<Fragrance, 'profile'>): { calor: boolean; frio: boolean } {
  const c = profileOf(f).clima;
  const all = has(c, /todo el ano|todas las|4 estaciones|cualquier/);
  return { calor: all || has(c, /primavera|verano|calor|calid/), frio: all || has(c, /otono|invierno|frio|noches templadas/) };
}

export function usesOf(f: Pick<Fragrance, 'profile'>): Set<Use> {
  const o = profileOf(f).ocasion;
  const out = new Set<Use>();
  if (has(o, /dia|diario|oficina|escuela|trabajo|casual|clima calido/)) out.add('dia');
  if (has(o, /noche|nocturn|salidas|fiesta|evento|formal|cena/)) out.add('noche');
  if (has(o, /cita|romant|seduc/)) out.add('cita');
  if (has(o, /versatil|todo|cualquier/) || (out.has('dia') && out.has('noche'))) out.add('todo');
  return out;
}

/** Presentación que se ofrece primero según lo que pidió la persona. */
export function offerFor(f: FragranceSummary, sizes: SizeConfig[], a: FinderAnswers): { key: string; price: number; onDemand: boolean } | null {
  const allowWait = a.when === 'espero';
  const decants = sizes.filter((s) => s.kind === 'decant').map((s) => s.key);
  const keys = a.format === 'botella' ? [BOTTLE] : a.format === 'decant' ? decants : [...decants, BOTTLE];
  for (const pass of [false, true]) {
    if (pass && !allowWait) break;
    for (const key of keys) {
      const st = sizeState(f as Fragrance, key, sizes);
      if (st.ok && !st.noPrice && !!st.onDemand === pass && st.price > 0) return { key, price: st.price, onDemand: !!st.onDemand };
    }
  }
  return null;
}

export interface FinderResult {
  fragrance: FragranceSummary;
  score: number;
  /** Cumple todo lo que pidió */
  perfect: boolean;
  reasons: string[];
  families: FamilyKey[];
  offer: { key: string; price: number; onDemand: boolean };
}

const USE_TEXT: Record<Use, string> = { dia: 'Ideal para el día', noche: 'Luce de noche', todo: 'Funciona para todo', cita: 'Pensado para una cita' };

/** Ordena el catálogo según las respuestas. Nunca devuelve algo que no se pueda comprar como lo pidió. */
export function recommend(list: FragranceSummary[], sizes: SizeConfig[], a: FinderAnswers, rating: (id: string) => number = () => 0): FinderResult[] {
  const wanted = (a.families ?? []).slice(0, 2);
  const out: FinderResult[] = [];
  for (const f of list) {
    if (f.comingSoon && a.when !== 'espero') continue;
    const offer = offerFor(f, sizes, a);
    if (!offer) continue;
    const fams = familiesOf(f);
    const clima = climateOf(f);
    const uses = usesOf(f);
    const gender = plain(f.gender ?? 'unisex');
    const reasons: string[] = [];
    let score = 0;
    let perfect = true;

    // Aroma (lo que más pesa)
    const famHits = wanted.filter((k) => fams.includes(k));
    if (wanted.length) {
      score += famHits.length * 4 + famHits.reduce((s, k) => s + (fams.indexOf(k) === 0 ? 1.5 : 0), 0);
      if (!famHits.length) perfect = false;
    }
    if (fams.length) reasons.push(fams.slice(0, 3).map((k) => FAMILY_BY_KEY.get(k)!.label.split(' y ')[0].toLowerCase()).join(', ').replace(/^./, (c) => c.toUpperCase()));

    // Momento
    if (a.use) {
      const ok = uses.has(a.use) || (a.use === 'todo' && uses.size >= 2) || (a.use === 'cita' && uses.has('noche'));
      if (ok) {
        score += 2;
        reasons.push(USE_TEXT[a.use]);
      } else perfect = false;
    }

    // Clima
    if (a.climate) {
      const ok = a.climate === 'todo' ? clima.calor && clima.frio : clima[a.climate];
      if (ok) {
        score += 2;
        reasons.push(a.climate === 'calor' ? 'Para primavera y verano' : a.climate === 'frio' ? 'Para otoño e invierno' : 'Para todo el año');
      } else if (a.climate !== 'todo') perfect = false;
    }

    // Estilo: solo acomoda el orden
    if (a.style === 'masc') score += gender.includes('masc') ? 1.5 : gender.includes('fem') ? -2 : 0.8;
    if (a.style === 'fem') score += gender.includes('fem') ? 1.5 : gender.includes('masc') ? -2 : 0.8;

    // Desempate: mejor calificados primero
    score += Math.min(5, rating(f.id) || Number(profileOf(f).rating) || 0) * 0.1;
    if (offer.onDemand) reasons.push('Te lo pedimos especialmente');

    out.push({ fragrance: f, score, perfect, reasons: reasons.slice(0, 3), families: fams, offer });
  }
  return out.sort((x, y) => Number(y.perfect) - Number(x.perfect) || y.score - x.score);
}

/** Etiquetas de las respuestas (para los chips de resultados). */
export function answerChips(a: FinderAnswers): string[] {
  const pick = <T extends string>(opts: FinderOption<T>[], v?: T) => opts.find((o) => o.value === v)?.label;
  return [
    pick(STYLE_OPTIONS, a.style),
    ...(a.families?.length ? a.families.map((k) => FAMILY_BY_KEY.get(k)?.label) : ['Sorpréndeme']),
    pick(USE_OPTIONS, a.use),
    pick(CLIMATE_OPTIONS, a.climate),
    pick(FORMAT_OPTIONS, a.format),
    pick(WHEN_OPTIONS, a.when),
  ].filter((x): x is string => !!x);
}
