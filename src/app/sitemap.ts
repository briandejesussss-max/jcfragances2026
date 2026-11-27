import type { MetadataRoute } from 'next';
import { getCatalog } from '@/controllers/catalog.controller';
import { fragranceSlug } from '@/lib/utils/slug';
import { FAMILIES } from '@/models/domain/families';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jcfragances2026.vercel.app';
  let slugs: string[] = [];
  try {
    slugs = (await getCatalog()).fragrances.map(fragranceSlug);
  } catch {
    slugs = [];
  }
  return [{ url: base, changeFrequency: 'daily', priority: 1 }, { url: `${base}/ayuda`, changeFrequency: 'monthly' as const, priority: 0.5 }, { url: `${base}/encuentra-tu-perfume`, changeFrequency: 'monthly' as const, priority: 0.7 }, ...FAMILIES.map((f) => ({ url: `${base}/familia/${f.key}`, changeFrequency: 'weekly' as const, priority: 0.6 })), ...slugs.map((s) => ({ url: `${base}/perfume/${s}`, changeFrequency: 'weekly' as const, priority: 0.8 }))];
}
