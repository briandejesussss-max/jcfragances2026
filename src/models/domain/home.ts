import { createdTimestamp } from './catalog';
import type { FragranceSummary, HomeConfig, HomeOccasion, InstagramPhoto } from '../types';

/** Portada: valores predeterminados y reglas. */

export const MAX_CAROUSEL = 6;
export const MAX_INSTAGRAM = 12;
export const CAPTION_MAX = 80;

/** Las 4 ocasiones de "Un perfume para cada momento" y las palabras con que se eligen solas. */
export const DEFAULT_OCCASIONS: Array<{ title: string; words: RegExp }> = [
  { title: 'Para una cita', words: /cita|rom[aá]nt|seduc|noche rom/i },
  { title: 'Para la oficina', words: /oficina|trabajo|formal|negocio/i },
  { title: 'Para salir de noche', words: /noche|fiesta|antro|evento|salir/i },
  { title: 'Para diario', words: /diario|casual|d[ií]a|todo uso|vers[aá]til/i },
];

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

/** Perfumes del carrusel: los elegidos en el panel o, si no hay, el anterior "perfume de portada" y los más nuevos. */
export function resolveCarousel(home: HomeConfig | undefined, fragrances: FragranceSummary[]): string[] {
  const ok = new Map(fragrances.filter((f) => f.image && !f.comingSoon).map((f) => [f.id, f]));
  const chosen = (home?.carouselIds ?? []).filter((id) => ok.has(id));
  if (chosen.length) return chosen.slice(0, MAX_CAROUSEL);
  const newest = [...ok.values()].sort((a, b) => createdTimestamp(b.id) - createdTimestamp(a.id)).map((f) => f.id);
  return [...new Set([home?.featuredId, ...newest].filter((id): id is string => !!id && ok.has(id)))].slice(0, 5);
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
  const carouselIds = [...new Set((input?.carouselIds ?? []).filter((id) => validIds.has(id)))].slice(0, MAX_CAROUSEL);
  return { carouselIds, ...(featuredId ? { featuredId } : {}), occasions, instagram };
}
