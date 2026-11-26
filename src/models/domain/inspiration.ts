import type { Inspiration, Similarity } from '../types';

/** "Inspirado en": qué tan parecido es al perfume original. */
export const SIMILARITY_OPTIONS: Array<{ value: Similarity; label: string; dots: number }> = [
  { value: 'muy', label: 'Muy parecido', dots: 3 },
  { value: 'similar', label: 'Similar', dots: 2 },
  { value: 'toque', label: 'Toque inspirado', dots: 1 },
];

export const similarityOf = (s: Similarity | undefined) => SIMILARITY_OPTIONS.find((o) => o.value === s) ?? SIMILARITY_OPTIONS[1];

export const NOTE_MAX = 120;

/** Limpia lo que llega del formulario; sin nombre del original no se guarda nada. */
export function sanitizeInspiration(input: Partial<Inspiration> | undefined | null): Inspiration | undefined {
  const name = String(input?.name ?? '').trim().slice(0, 60);
  if (!name) return undefined;
  const image = String(input?.image ?? '').trim();
  const note = String(input?.note ?? '').trim().slice(0, NOTE_MAX);
  return {
    brand: String(input?.brand ?? '').trim().slice(0, 60),
    name,
    similarity: similarityOf(input?.similarity).value,
    ...(image ? { image } : {}),
    ...(note ? { note } : {}),
  };
}

/** "Creed · Aventus" (o solo "Aventus" si no hay casa). */
export const inspirationTitle = (i: Inspiration, sep = ' · ') => (i.brand ? `${i.brand}${sep}${i.name}` : i.name);
