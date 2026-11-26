import type { FragranceSummary } from '../types';

/** Filtros y orden del catálogo público. */

export type SortOrder = 'recent' | 'name_asc' | 'name_desc' | 'brand_asc' | 'brand_desc';

export const SORT_OPTIONS: Array<{ value: SortOrder; label: string }> = [
  { value: 'recent', label: 'Más recientes' },
  { value: 'name_asc', label: 'Nombre (A-Z)' },
  { value: 'name_desc', label: 'Nombre (Z-A)' },
  { value: 'brand_asc', label: 'Casa (A-Z)' },
  { value: 'brand_desc', label: 'Casa (Z-A)' },
];

export const GENDER_OPTIONS = ['Unisex', 'Masculino', 'Femenino'] as const;

export interface CatalogFilter {
  query: string;
  brand: string;
  gender: string;
  sort: SortOrder;
}

export const DEFAULT_FILTER: CatalogFilter = { query: '', brand: 'ALL', gender: 'ALL', sort: 'recent' };

/** El id guarda la fecha de alta (frag-1793840232866). */
export const createdTimestamp = (id: string) => {
  const m = String(id).match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
};

const byText = (a = '', b = '') => a.localeCompare(b, 'es', { sensitivity: 'base' });

export function filterCatalog(list: FragranceSummary[], filter: CatalogFilter): FragranceSummary[] {
  const q = filter.query.toLowerCase().trim();
  const filtered = list.filter((f) => {
    const brandOk = filter.brand === 'ALL' || f.brand === filter.brand;
    const genderOk = filter.gender === 'ALL' || (f.gender ?? '').toLowerCase() === filter.gender.toLowerCase();
    const queryOk =
      !q ||
      (f.name ?? '').toLowerCase().includes(q) ||
      (f.brand ?? '').toLowerCase().includes(q) ||
      (f.notes ?? '').toLowerCase().includes(q) ||
      (f.inspiration ? `${f.inspiration.brand} ${f.inspiration.name}`.toLowerCase().includes(q) : false);
    return brandOk && genderOk && queryOk;
  });

  return filtered.sort((a, b) => {
    switch (filter.sort) {
      case 'name_asc':
        return byText(a.name, b.name);
      case 'name_desc':
        return byText(b.name, a.name);
      case 'brand_asc':
        return byText(a.brand, b.brand) || byText(a.name, b.name);
      case 'brand_desc':
        return byText(b.brand, a.brand) || byText(b.name, a.name);
      default: {
        const ta = createdTimestamp(a.id);
        const tb = createdTimestamp(b.id);
        if (ta && tb && ta !== tb) return tb - ta;
        return a.position - b.position;
      }
    }
  });
}

export const brandsOf = (list: FragranceSummary[]) =>
  Array.from(new Set(list.map((f) => f.brand).filter(Boolean))).sort((a, b) => byText(a, b));

/** Casas con su número de fragancias, de la que más tiene a la que menos. */
export function brandCounts(list: FragranceSummary[]): Array<{ brand: string; count: number }> {
  const m = new Map<string, number>();
  list.forEach((f) => f.brand && m.set(f.brand, (m.get(f.brand) ?? 0) + 1));
  return [...m].map(([brand, count]) => ({ brand, count })).sort((a, b) => b.count - a.count || byText(a.brand, b.brand));
}

/** Las fragancias más nuevas que tienen foto (fondo del encabezado). */
export const newestWithImage = (list: FragranceSummary[], n: number) =>
  list
    .filter((f) => f.image)
    .sort((a, b) => createdTimestamp(b.id) - createdTimestamp(a.id))
    .slice(0, n);
