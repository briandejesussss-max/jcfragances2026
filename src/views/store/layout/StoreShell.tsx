import type { ReactNode } from 'react';
import type { CatalogData } from '@/controllers/catalog.controller';
import { CartDrawer } from '../cart/CartDrawer';
import { Analytics } from '../state/Analytics';
import { ScrollReveal } from '../state/ScrollReveal';
import { CatalogFilterProvider } from '../state/CatalogFilterContext';
import { StoreProvider } from '../state/StoreProvider';
import { Footer } from './Footer';
import { Header } from './Header';
import { MobileTabBar } from './MobileTabBar';
import { PromoBar } from './PromoBar';
import { SideMenu } from './SideMenu';

/** Marco común de la tienda: estado, encabezado, menú, bolsa y pie. */
export function StoreShell({ data, children }: { data: CatalogData; children: ReactNode }) {
  return (
    <StoreProvider config={data.config} fragrances={data.fragrances} usdRate={data.usdRate} reviewStats={data.reviewStats}>
      <CatalogFilterProvider>
        <Analytics />
        <ScrollReveal />
        <PromoBar />
        <Header />
        <SideMenu />
        <CartDrawer />
        <main className="min-h-[70dvh]">{children}</main>
        <Footer config={data.config} />
        {/* Espacio para que la barra de pestañas (celular) no tape el pie de página */}
        <div className="h-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:hidden [@media(orientation:landscape)_and_(max-height:500px)]:h-[calc(3rem+env(safe-area-inset-bottom,0px))]" aria-hidden="true" />
        <MobileTabBar />
      </CatalogFilterProvider>
    </StoreProvider>
  );
}
