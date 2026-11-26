import type { FragranceSummary, HomeConfig, HomeOccasion, InstagramPhoto } from '../types';

/** Portada: valores predeterminados y reglas. */

export const DEFAULT_CAP_PCT = 24;
export const MAX_INSTAGRAM = 12;
export const CAPTION_MAX = 80;

/** Las 4 ocasiones de "Un perfume para cada momento" y las palabras con que se eligen solas. */
export const DEFAULT_OCCASIONS: Array<{ title: string; words: RegExp }> = [
  { title: 'Para una cita', words: /cita|rom[aá]nt|seduc|noche rom/i },
  { title: 'Para la oficina', words: /oficina|trabajo|formal|negocio/i },
  { title: 'Para salir de noche', words: /noche|fiesta|antro|evento|salir/i },
  { title: 'Para diario', words: /diario|casual|d[ií]a|todo uso|vers[aá]til/i },
];

export const clampCap = (n: unknown) => Math.min(60, Math.max(5, Math.round(Number(n) || DEFAULT_CAP_PCT)));

/**
 * Ocasiones listas para mostrar: usa el perfume elegido en el panel o, si no hay,
 * uno cuya "ocasión" coincida; sin repetir perfumes y solo con foto.
 */
export function resolveOccasions(home: HomeConfig | undefined, fragrances: FragranceSummary[]): Array<{ title: string; fragrance: FragranceSummary }> {
  const withImg = fragrances.filter((f) => f.image && !f.comingSoon);
  const byId = new Map(withImg.map((f) => [f.id, f]));
  const used = new Set<string>();
  const saved = home?.occasions ?? [];
  return DEFAULT_OCCASIONS.map((d, i) => {
    const title = saved[i]?.title?.trim() || d.title;
    let f = saved[i]?.fragranceId ? byId.get(saved[i].fragranceId!) : undefined;
    if (!f || used.has(f.id)) f = withImg.find((x) => !used.has(x.id) && d.words.test(x.profile?.ocasion ?? ''));
    if (!f) f = withImg.find((x) => !used.has(x.id));
    if (f) used.add(f.id);
    return f ? { title, fragrance: f } : null;
  }).filter((x): x is { title: string; fragrance: FragranceSummary } => !!x);
}

/** Limpia lo que llega del panel. */
export function sanitizeHome(input: HomeConfig | undefined, validIds: Set<string>): HomeConfig {
  const featuredId = input?.featuredId && validIds.has(input.featuredId) ? input.featuredId : undefined;
  const occasions: HomeOccasion[] = DEFAULT_OCCASIONS.map((d, i) => {
    const o = input?.occasions?.[i];
    const id = o?.fragranceId && validIds.has(o.fragranceId) ? o.fragranceId : undefined;
    return { title: String(o?.title ?? '').trim().slice(0, 40) || d.title, ...(id ? { fragranceId: id } : {}) };
  });
  const instagram: InstagramPhoto[] = (input?.instagram ?? [])
    .map((p) => {
      const image = String(p?.image ?? '').trim();
      const link = String(p?.link ?? '').trim();
      const caption = String(p?.caption ?? '').trim().slice(0, CAPTION_MAX);
      const fragranceId = p?.fragranceId && validIds.has(p.fragranceId) ? p.fragranceId : undefined;
      return { image, ...(/^https:\/\//i.test(link) ? { link } : {}), ...(caption ? { caption } : {}), ...(fragranceId ? { fragranceId } : {}) };
    })
    .filter((p) => /^https:\/\//i.test(p.image))
    .slice(0, MAX_INSTAGRAM);
  return { featuredId, capPct: clampCap(input?.capPct), occasions, instagram };
}
