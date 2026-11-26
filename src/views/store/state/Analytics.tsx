'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/analytics/track';
import { fragranceSlug } from '@/lib/utils/slug';
import { useStore } from './StoreProvider';

/** Registra visitas a páginas, fichas de perfume vistas y clics a WhatsApp. */
export function Analytics() {
  const pathname = usePathname();
  const { fragrances } = useStore();

  useEffect(() => {
    track('page_view');
    const m = pathname.match(/^\/perfume\/([^/]+)/);
    if (m) {
      const slug = decodeURIComponent(m[1]);
      const f = fragrances.find((x) => fragranceSlug(x) === slug || x.id === slug);
      if (f) track('product_view', f.id);
    }
    // Solo cuando cambia la página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (a && /(wa\.me|whatsapp\.com)/.test(a.href)) track('whatsapp_click');
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  return null;
}
