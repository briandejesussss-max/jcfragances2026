import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCatalog, getFragranceBySlug, getFragranceReviews } from '@/controllers/catalog.controller';
import { fragranceSlug } from '@/lib/utils/slug';
import { ProductView } from '@/views/store/product/ProductView';

export const revalidate = 600;

type Props = { params: Promise<{ slug: string }> };

/** Pre-genera la ficha de cada perfume del catálogo. */
export async function generateStaticParams() {
  try {
    const { fragrances } = await getCatalog();
    return fragrances.map((f) => ({ slug: fragranceSlug(f) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const f = await getFragranceBySlug(slug);
  if (!f) return { title: 'Fragancia no encontrada' };
  const description = `${f.brand} ${f.name} (${f.concentration || 'EDP'}) en decants y botella. ${f.notes ?? ''}`.slice(0, 160);
  return {
    title: `${f.brand} ${f.name}`,
    description,
    alternates: { canonical: `/perfume/${fragranceSlug(f)}` },
    openGraph: { title: `${f.brand} ${f.name}`, description, images: f.image ? [{ url: f.image }] : undefined },
  };
}

export default async function PerfumePage({ params }: Props) {
  const { slug } = await params;
  const fragrance = await getFragranceBySlug(slug);
  if (!fragrance) notFound();
  const reviews = await getFragranceReviews(fragrance.id);
  return <ProductView fragrance={fragrance} reviews={reviews} />;
}
