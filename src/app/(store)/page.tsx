import { getCatalog, getFragranceById } from '@/controllers/catalog.controller';
import { fragranceSlug } from '@/lib/utils/slug';
import { clampCap, resolveOccasions } from '@/models/domain/home';
import { guessEmoji, guessImage, pyramidFor, PYRAMID_SECTIONS } from '@/models/domain/pyramid';
import { Catalog } from '@/views/store/catalog/Catalog';
import { BrandsCarousel } from '@/views/store/home/BrandsCarousel';
import { BuildDecant } from '@/views/store/home/BuildDecant';
import { CuratedShelf } from '@/views/store/home/CuratedShelf';
import { FeatureHero, type FeatureNote } from '@/views/store/home/FeatureHero';
import { GradientBand } from '@/views/store/home/GradientBand';
import { Hero } from '@/views/store/home/Hero';
import { InstagramGallery } from '@/views/store/home/InstagramGallery';
import { Occasions } from '@/views/store/home/Occasions';

// Página estática regenerada en segundo plano (ISR); el panel la invalida al guardar cambios.
export const revalidate = 600;

export default async function HomePage() {
  const { config, fragrances } = await getCatalog();
  const home = config.home;
  const featured = home?.featuredId ? await getFragranceById(home.featuredId) : null;
  const pyramid = featured?.image ? pyramidFor(featured) : null;

  // Hasta 2 notas por nivel (salida, corazón, fondo) para que quepan alrededor del frasco.
  const notes: FeatureNote[] = pyramid
    ? PYRAMID_SECTIONS.flatMap((s) => pyramid[s].slice(0, 2).map((n) => ({ section: s, text: n.t, img: n.img || guessImage(n.t), emoji: n.e || guessEmoji(n.t, s) })))
    : [];

  // Fotos de Instagram con su perfume de referencia (si lo tienen)
  const byId = new Map(fragrances.map((f) => [f.id, f]));
  const gallery = (home?.instagram ?? []).map((p) => {
    const f = p.fragranceId ? byId.get(p.fragranceId) : undefined;
    return { image: p.image, link: p.link, caption: p.caption, fragrance: f ? { name: f.name, brand: f.brand, href: `/perfume/${fragranceSlug(f)}` } : undefined };
  });

  return (
    <>
      {featured?.image && notes.length ? (
        <>
          <FeatureHero brand={featured.brand} name={featured.name} image={featured.image} href={`/perfume/${fragranceSlug(featured)}`} capPct={clampCap(home?.capPct)} notes={notes} />
          <GradientBand />
          <BuildDecant featuredId={featured.id} />
          <Occasions items={resolveOccasions(home, fragrances)} />
        </>
      ) : (
        <Hero config={config} fragrances={fragrances} />
      )}
      <CuratedShelf />
      <BrandsCarousel />
      <Catalog />
      <InstagramGallery photos={gallery} handle={config.instagram} url={config.instagramUrl ?? ''} />
    </>
  );
}
