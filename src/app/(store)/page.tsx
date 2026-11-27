import { getCatalog } from '@/controllers/catalog.controller';
import { fragranceSlug } from '@/lib/utils/slug';
import { resolveCarousel, resolveOccasions } from '@/models/domain/home';
import { Catalog } from '@/views/store/catalog/Catalog';
import { BrandsCarousel } from '@/views/store/home/BrandsCarousel';
import { BuildDecant } from '@/views/store/home/BuildDecant';
import { CuratedShelf } from '@/views/store/home/CuratedShelf';
import { FeaturedCarousel } from '@/views/store/home/FeaturedCarousel';
import { FinderPromo } from '@/views/store/home/FinderPromo';
import { GradientBand } from '@/views/store/home/GradientBand';
import { Hero } from '@/views/store/home/Hero';
import { InstagramGallery } from '@/views/store/home/InstagramGallery';
import { Occasions } from '@/views/store/home/Occasions';
import { RecentlyViewed } from '@/views/store/home/RecentlyViewed';
import { SocialProof } from '@/views/store/home/SocialProof';

// Página estática regenerada en segundo plano (ISR); el panel la invalida al guardar cambios.
export const revalidate = 600;

export default async function HomePage() {
  const { config, fragrances } = await getCatalog();
  const home = config.home;
  const carousel = resolveCarousel(home, fragrances);

  // Fotos de Instagram con su perfume de referencia (si lo tienen)
  const byId = new Map(fragrances.map((f) => [f.id, f]));
  const gallery = (home?.instagram ?? []).map((p) => {
    const f = p.fragranceId ? byId.get(p.fragranceId) : undefined;
    return { image: p.image, link: p.link, caption: p.caption, fragrance: f ? { name: f.name, brand: f.brand, href: `/perfume/${fragranceSlug(f)}` } : undefined };
  });

  return (
    <>
      {carousel.length ? (
        <>
          <FeaturedCarousel ids={carousel} />
          <GradientBand />
          <BuildDecant featuredId={carousel[0]} />
          <Occasions items={resolveOccasions(home, fragrances)} />
        </>
      ) : (
        <Hero config={config} fragrances={fragrances} />
      )}
      <SocialProof />
      <FinderPromo />
      <RecentlyViewed />
      <CuratedShelf />
      <BrandsCarousel />
      <Catalog />
      <InstagramGallery photos={gallery} handle={config.instagram} url={config.instagramUrl ?? ''} />
    </>
  );
}
