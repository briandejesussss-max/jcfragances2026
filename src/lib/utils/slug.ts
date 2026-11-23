export function slugify(text: string): string {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Slug público de una fragancia: "casa-nombre". */
export const fragranceSlug = (f: { brand?: string; name?: string }) => slugify(`${f.brand ?? ''} ${f.name ?? ''}`);

/** Texto normalizado para comparar sin acentos ni signos. */
export const normalizeText = (s: string) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
