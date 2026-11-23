import { getCatalog } from '@/controllers/catalog.controller';
import { Catalog } from '@/views/store/catalog/Catalog';
import { BrandsCarousel } from '@/views/store/home/BrandsCarousel';
import { CuratedShelf } from '@/views/store/home/CuratedShelf';
import { Hero } from '@/views/store/home/Hero';

// Página estática regenerada en segundo plano (ISR); el panel la invalida al guardar cambios.
export const revalidate = 600;

export default async function HomePage() {
  const { config, fragrances } = await getCatalog();
  return (
    <>
      <Hero config={config} fragrances={fragrances} />
      <CuratedShelf />
      <BrandsCarousel />
      <Catalog />
    </>
  );
}
