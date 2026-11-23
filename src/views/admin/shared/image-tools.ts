'use client';

/** Utilidades de imagen del panel (se ejecutan en el navegador antes de subir a Storage). */

export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('No se pudo leer el archivo'));
    r.readAsDataURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo leer esa imagen'));
    img.src = src;
  });
}

function canvasToBlob(cv: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => cv.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo procesar la imagen'))), type, quality));
}

/** Reduce la imagen a un lado máximo y la exporta (JPEG para fotos, PNG/WebP si necesita transparencia). */
export async function resizeImage(file: File, maxSide: number, type: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/webp', quality = 0.85): Promise<Blob> {
  const img = await loadImage(await readAsDataUrl(file));
  const k = Math.min(1, maxSide / Math.max(img.width, img.height));
  const cv = document.createElement('canvas');
  cv.width = Math.round(img.width * k);
  cv.height = Math.round(img.height * k);
  cv.getContext('2d')!.drawImage(img, 0, 0, cv.width, cv.height);
  return canvasToBlob(cv, type, quality);
}

/**
 * Foto de frasco: si trae un fondo negro pegado a los bordes (pasa con PNG transparentes guardados
 * desde Fotos), lo vuelve transparente. Solo toca el negro conectado al borde. Devuelve si lo limpió.
 */
export async function prepareBottlePhoto(file: File): Promise<{ blob: Blob; cleaned: boolean }> {
  const img = await loadImage(await readAsDataUrl(file));
  const maxDim = 1000;
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  if (Math.max(w, h) > maxDim) {
    const k = maxDim / Math.max(w, h);
    w = Math.round(w * k);
    h = Math.round(h * k);
  }
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const im = ctx.getImageData(0, 0, w, h);
  const d = im.data;
  const isBlack = (i: number) => d[i + 3] < 20 || (d[i] <= 10 && d[i + 1] <= 10 && d[i + 2] <= 10);
  const corners = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + (w - 1)) * 4];

  if (corners.every((i) => d[i + 3] >= 200 && isBlack(i))) {
    const seen = new Uint8Array(w * h);
    const stack: number[] = [];
    const push = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const k = y * w + x;
      if (seen[k] || !isBlack(k * 4)) return;
      seen[k] = 1;
      stack.push(k);
    };
    for (let x = 0; x < w; x++) {
      push(x, 0);
      push(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      push(0, y);
      push(w - 1, y);
    }
    while (stack.length) {
      const k = stack.pop()!;
      const x = k % w;
      const y = (k - x) / w;
      push(x + 1, y);
      push(x - 1, y);
      push(x, y + 1);
      push(x, y - 1);
    }
    // Borde: píxeles oscuros junto al fondo quitado quedan semitransparentes (sin halo negro)
    const fringe: number[] = [];
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const k = y * w + x;
        if (seen[k]) continue;
        if (seen[k - 1] || seen[k + 1] || seen[k - w] || seen[k + w]) {
          const i = k * 4;
          if (Math.max(d[i], d[i + 1], d[i + 2]) < 70) fringe.push(i);
        }
      }
    for (let k = 0; k < seen.length; k++) if (seen[k]) d[k * 4 + 3] = 0;
    fringe.forEach((i) => (d[i + 3] = 90));
    ctx.putImageData(im, 0, 0);
    return { blob: await canvasToBlob(cv, 'image/png'), cleaned: true };
  }
  return { blob: await canvasToBlob(cv, 'image/webp', 0.88), cleaned: false };
}
