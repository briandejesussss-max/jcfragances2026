import 'server-only';

import sharp from 'sharp';

/**
 * Descarga una foto (avif, webp, png, jpg…) y la convierte a PNG en "data URL" para las
 * imágenes de vista previa (WhatsApp, Facebook…). Si algo falla devuelve null y la imagen
 * se genera sin esa foto, en vez de romperse.
 */
export async function photoDataUrl(url: string | undefined, width: number, height: number): Promise<string | null> {
  if (!url || !/^https:\/\//i.test(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const png = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize({ width, height, fit: 'inside', withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch {
    return null;
  }
}

/** Medidas recomendadas para la vista previa de enlaces. */
export const OG_SIZE = { width: 1200, height: 630 };

/** "$190" (sin decimales si no hacen falta). */
export const ogMoney = (n: number) => '$' + (Number.isInteger(n) ? String(n) : n.toFixed(2));
