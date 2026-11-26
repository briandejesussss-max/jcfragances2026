import type { ReactNode } from 'react';
import type { CatalogData } from '@/controllers/catalog.controller';
import { CartDrawer } from '../cart/CartDrawer';
import { Analytics } from '../state/Analytics';
import { CatalogFilterProvider } from '../state/CatalogFilterContext';
import { StoreProvider } from '../state/StoreProvider';
import { Footer } from './Footer';
import { Header } from './Header';
import { SideMenu } from './SideMenu';

/** Marco común de la tienda: estado, encabezado, menú, bolsa y pie. */
export function StoreShell({ data, children }: { data: CatalogData; children: ReactNode }) {
  return (
    <StoreProvider config={data.config} fragrances={data.fragrances} usdRate={data.usdRate} reviewStats={data.reviewStats}>
      <CatalogFilterProvider>
        <Analytics />
        <Header />
        <SideMenu />
        <CartDrawer />
        <main className="min-h-[70dvh]">{children}</main>
        <Footer config={data.config} />
      </CatalogFilterProvider>
    </StoreProvider>
  );
}
