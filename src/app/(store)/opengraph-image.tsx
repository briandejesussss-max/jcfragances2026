import { ImageResponse } from 'next/og';
import { getCatalog } from '@/controllers/catalog.controller';
import { OG_SIZE, photoDataUrl } from '@/lib/og/photo';
import { newestWithImage } from '@/models/domain/catalog';

/** Vista previa al compartir la tienda (WhatsApp, Facebook, Instagram…): nombre, lema y 3 frascos del catálogo. */
export const alt = 'JS FRAGANCES — decants y perfumes de autor';
export const size = OG_SIZE;
export const contentType = 'image/png';
export const revalidate = 3600;

export default async function Image() {
  const { config, fragrances } = await getCatalog();
  const name = (config.name || 'JS FRAGANCES').toUpperCase();
  const tagline = config.tagline || 'Tu muestra de lujo al mejor precio';
  const [logo, ...bottles] = await Promise.all([
    photoDataUrl(config.logo, 160, 160),
    ...newestWithImage(fragrances, 3).map((f) => photoDataUrl(f.image, 300, 420)),
  ]);
  const shown = bottles.filter((b): b is string => !!b);

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: 'linear-gradient(135deg, #17110b 0%, #050505 60%)', color: '#f5f5f5', padding: 64, fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: 560 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} width={88} height={88} style={{ borderRadius: 44, objectFit: 'cover' }} alt="" />
            )}
            <div style={{ fontSize: 30, letterSpacing: 6, color: '#ff6a1a' }}>DECANTS · BOTELLAS</div>
          </div>
          <div style={{ fontSize: 76, fontWeight: 700, marginTop: 28, lineHeight: 1.05 }}>{name}</div>
          <div style={{ fontSize: 34, color: '#d0c6ba', marginTop: 18 }}>{tagline}</div>
          <div style={{ fontSize: 26, color: '#9a9a9a', marginTop: 34 }}>Envíos a todo México · Perfumes de autor y árabes</div>
        </div>
        <div style={{ display: 'flex', flex: 1, alignItems: 'flex-end', justifyContent: 'center', gap: 6 }}>
          {shown.map((src, k) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={k} src={src} alt="" style={{ height: k === 1 ? 420 : 340, maxWidth: 200, objectFit: 'contain' }} />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
