import type { Inspiration, InspirationRef, Similarity } from '../types';

/** "Inspirado en": qué tan parecido es al perfume original. */
export const SIMILARITY_OPTIONS: Array<{ value: Similarity; label: string; dots: number }> = [
  { value: 'muy', label: 'Muy parecido', dots: 3 },
  { value: 'similar', label: 'Similar', dots: 2 },
  { value: 'toque', label: 'Toque inspirado', dots: 1 },
];

export const similarityOf = (s: Similarity | undefined) => SIMILARITY_OPTIONS.find((o) => o.value === s) ?? SIMILARITY_OPTIONS[1];

export const NOTE_MAX = 120;
/** Máximo de perfumes originales (híbridos). */
export const MAX_REFS = 4;

/** Todos los originales: el principal y los demás (híbridos). */
export const inspirationRefs = (i: Inspiration): InspirationRef[] =>
  [{ brand: i.brand, name: i.name, image: i.image }, ...(i.others ?? [])].filter((r) => r.name?.trim());

function cleanRef(r: Partial<InspirationRef> | undefined | null): InspirationRef | null {
  const name = String(r?.name ?? '').trim().slice(0, 60);
  if (!name) return null;
  const image = String(r?.image ?? '').trim();
  return { brand: String(r?.brand ?? '').trim().slice(0, 60), name, ...(image ? { image } : {}) };
}

/** Limpia lo que llega del formulario; sin ningún perfume original no se guarda nada. */
export function sanitizeInspiration(input: Partial<Inspiration> | undefined | null): Inspiration | undefined {
  const refs = [cleanRef(input), ...(input?.others ?? []).map(cleanRef)].filter((r): r is InspirationRef => !!r).slice(0, MAX_REFS);
  if (!refs.length) return undefined;
  const [first, ...others] = refs;
  const note = String(input?.note ?? '').trim().slice(0, NOTE_MAX);
  return {
    ...first,
    similarity: similarityOf(input?.similarity).value,
    ...(note ? { note } : {}),
    ...(others.length ? { others } : {}),
  };
}

/** "Creed · Aventus" (o solo "Aventus" si no hay casa). */
export const refTitle = (r: InspirationRef, sep = ' · ') => (r.brand ? `${r.brand}${sep}${r.name}` : r.name);

/** Un original: "Creed · Aventus". Híbrido: "Molecule 01 + Wulong Cha". */
export function inspirationTitle(i: Inspiration, sep = ' · '): string {
  const refs = inspirationRefs(i);
  return refs.length > 1 ? refs.map((r) => r.name).join(' + ') : refTitle(refs[0] ?? i, sep);
}

/** Casas de un híbrido sin repetir: "Escentric Molecules · Nishane". */
export const inspirationBrands = (i: Inspiration) => [...new Set(inspirationRefs(i).map((r) => r.brand).filter(Boolean))].join(' · ');

/** Texto para buscar: casas y nombres de todos los originales. */
export const inspirationSearchText = (i: Inspiration | undefined) => (i ? inspirationRefs(i).map((r) => `${r.brand} ${r.name}`).join(' ').toLowerCase() : '');
