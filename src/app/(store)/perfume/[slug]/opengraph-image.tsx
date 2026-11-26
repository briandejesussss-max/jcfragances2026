import { ImageResponse } from 'next/og';
import { getCatalog, getFragranceBySlug } from '@/controllers/catalog.controller';
import { OG_SIZE, ogMoney, photoDataUrl } from '@/lib/og/photo';
import { inspirationTitle } from '@/models/domain/inspiration';
import { BOTTLE, sellableKeys, sizesOf } from '@/models/domain/sizes';

/** Vista previa al compartir un perfume: foto del frasco, casa, nombre y precio desde. */
export const alt = 'Perfume en JS FRAGANCES';
export const size = OG_SIZE;
export const contentType = 'image/png';
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [f, { config }] = await Promise.all([getFragranceBySlug(slug), getCatalog()]);
  const store = (config.name || 'JS FRAGANCES').toUpperCase();
  const bottle = await photoDataUrl(f?.image, 420, 520);

  const priceOf = (k: string) => Number((f?.prices as Record<string, { price?: number } | undefined> | undefined)?.[k]?.price) || 0;
  const prices = sellableKeys(sizesOf(config))
    .filter((k) => k !== BOTTLE)
    .map(priceOf)
    .filter((n) => n > 0);
  const from = prices.length ? Math.min(...prices) : 0;
  const details = [f?.concentration, f?.gender].filter(Boolean).join(' · ');
  const name = f?.name ?? store;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: 'linear-gradient(135deg, #17110b 0%, #050505 65%)', color: '#f5f5f5', padding: 56, fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', width: 440, alignItems: 'center', justifyContent: 'center' }}>
          {bottle && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bottle} alt="" style={{ maxHeight: 520, maxWidth: 420, objectFit: 'contain' }} />
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, paddingLeft: 40 }}>
          <div style={{ fontSize: 30, letterSpacing: 5, color: '#ff6a1a' }}>{(f?.brand ?? '').toUpperCase()}</div>
          <div style={{ fontSize: name.length > 22 ? 58 : 72, fontWeight: 700, lineHeight: 1.05, marginTop: 12 }}>{name}</div>
          {details && <div style={{ fontSize: 28, color: '#b0b0b0', marginTop: 18 }}>{details}</div>}
          {f?.inspiration?.name && <div style={{ fontSize: 26, color: '#ff9a5a', marginTop: 14 }}>{'Inspirado en ' + inspirationTitle(f.inspiration, ' ')}</div>}
          {from > 0 && <div style={{ fontSize: 40, marginTop: 30 }}>{'Decants desde ' + ogMoney(from)}</div>}
          <div style={{ fontSize: 24, color: '#8a8a8a', marginTop: 34, letterSpacing: 4 }}>{store}</div>
        </div>
      </div>
    ),
    size,
  );
}
