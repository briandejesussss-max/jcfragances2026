import type { Longevity, Review, Sillage } from '../types';

/** Reglas y resúmenes de reseñas. */

export const LONGEVITY_OPTIONS: Array<{ value: Longevity; label: string }> = [
  { value: 'poca', label: 'Poca (menos de 4 h)' },
  { value: 'media', label: 'Media (4 a 8 h)' },
  { value: 'larga', label: 'Larga (más de 8 h)' },
];

export const SILLAGE_OPTIONS: Array<{ value: Sillage; label: string }> = [
  { value: 'suave', label: 'Suave' },
  { value: 'moderada', label: 'Moderada' },
  { value: 'fuerte', label: 'Fuerte' },
];

export const LONGEVITY_LABEL: Record<Longevity, string> = { poca: 'Poca', media: 'Media', larga: 'Larga' };
export const SILLAGE_LABEL: Record<Sillage, string> = { suave: 'Suave', moderada: 'Moderada', fuerte: 'Fuerte' };

export const COMMENT_MAX = 600;

/** Opción más votada y su porcentaje (solo entre quienes respondieron). */
function majority<T extends string>(values: Array<T | null>): { value: T; pct: number; answered: number } | null {
  const answered = values.filter((v): v is T => !!v);
  if (!answered.length) return null;
  const counts = new Map<T, number>();
  answered.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  const [value, n] = [...counts].sort((a, b) => b[1] - a[1])[0];
  return { value, pct: Math.round((n / answered.length) * 100), answered: answered.length };
}

export interface ReviewSummary {
  count: number;
  average: number;
  longevity: ReturnType<typeof majority<Longevity>>;
  sillage: ReturnType<typeof majority<Sillage>>;
  /** Cuántas reseñas por número de estrellas (5 → 1) */
  distribution: Array<{ stars: number; count: number }>;
}

export function summarizeReviews(reviews: Review[]): ReviewSummary {
  const visible = reviews.filter((r) => !r.hidden);
  const count = visible.length;
  const average = count ? Math.round((visible.reduce((a, r) => a + r.rating, 0) / count) * 10) / 10 : 0;
  return {
    count,
    average,
    longevity: majority(visible.map((r) => r.longevity)),
    sillage: majority(visible.map((r) => r.sillage)),
    distribution: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: visible.filter((r) => r.rating === stars).length })),
  };
}

/** Mensaje claro para los errores que devuelve la base de datos al guardar una reseña. */
export function reviewErrorMessage(raw: string): string {
  if (raw.includes('sin compra entregada')) return 'Solo puedes calificar perfumes de pedidos ya entregados.';
  if (raw.includes('sin sesion')) return 'Tu sesión terminó. Vuelve a entrar a tu cuenta.';
  if (raw.includes('comentario largo')) return `El comentario puede tener hasta ${COMMENT_MAX} caracteres.`;
  if (raw.includes('calificacion')) return 'Elige de 1 a 5 estrellas.';
  if (raw.includes('sin links')) return 'Por seguridad, las reseñas no pueden llevar links ni páginas web.';
  if (raw.includes('falta nombre')) return 'Escribe tu nombre (al menos 2 letras).';
  if (raw.includes('limite diario')) return 'Llegaste al límite de reseñas por hoy. Intenta mañana.';
  if (raw.includes('sin visitante')) return 'Activa las cookies o el almacenamiento del navegador para dejar tu reseña.';
  return 'No se pudo guardar tu reseña. Intenta de nuevo.';
}
