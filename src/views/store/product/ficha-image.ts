'use client';

import { inspirationBrands, inspirationRefs, inspirationTitle, similarityOf } from '@/models/domain/inspiration';
import { fragranceSlug } from '@/lib/utils/slug';
import { profileOf } from '@/models/domain/profile';
import { guessImage, pyramidFor } from '@/models/domain/pyramid';
import { sellableKeys, sizeLabel } from '@/models/domain/sizes';
import type { Fragrance, Inspiration, SizeConfig, StoreConfig } from '@/models/types';

/** Genera la ficha olfativa descargable (PNG 1080×1350) en un <canvas>, con la paleta de la tienda. */

/** Colores café (los de siempre); se reemplazan por los de la paleta activa al generar la ficha. */
const CAFE = { bg: '#100904', bg2: '#1a0f08', bark: '#382416', cork: '#40372e', sand: '#c8b8a2', cream: '#ffedd7', ember: '#dc5000' };
type Palette = typeof CAFE;

/** Lee la paleta que tiene puesta la página (OLED, medianoche, blanco, grafito o café). */
function activePalette(): Palette {
  try {
    const css = getComputedStyle(document.documentElement);
    const v = (name: string, fallback: string) => css.getPropertyValue(`--color-${name}`).trim() || fallback;
    return { bg: v('walnut', CAFE.bg), bg2: v('umber', CAFE.bg2), bark: v('bark', CAFE.bark), cork: v('cork', CAFE.cork), sand: v('sand', CAFE.sand), cream: v('cream', CAFE.cream), ember: v('ember', CAFE.ember) };
  } catch {
    return CAFE;
  }
}

/** "#382416" + 0.6 → "rgba(56,36,22,0.6)" */
function alpha(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return hex;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';

async function blobImage(url: string): Promise<HTMLImageElement | null> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const objUrl = URL.createObjectURL(await res.blob());
    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objUrl);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
        resolve(null);
      };
      img.src = objUrl;
    });
  } catch {
    return null;
  }
}

async function loadImage(src: string | undefined): Promise<HTMLImageElement | null> {
  if (!src) return null;
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }
  const direct = await blobImage(src);
  if (direct) return direct;
  // Respaldo con proxy de imágenes si el servidor externo bloquea CORS
  if (/^https?:\/\//i.test(src)) return blobImage(`https://wsrv.nl/?url=${encodeURIComponent(src.replace(/^https?:\/\//i, ''))}&output=png`);
  return null;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = '';
  for (const w of String(text || '').split(/\s+/)) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

/** Recorta el texto con "…" para que quepa en el ancho dado (medido con la fuente actual). */
function fitWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) t = t.slice(0, -1);
  return t.trimEnd() + '…';
}

/** Usa la fuente más grande (de `max` a `min` px) con la que el texto cabe; si ni así, lo recorta con "…". */
function fitFont(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, weight: number, max: number, min: number) {
  let size = max;
  ctx.font = `${weight} ${size}px ${FONT}`;
  while (size > min && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = `${weight} ${size}px ${FONT}`;
  }
  return fitWidth(ctx, text, maxWidth);
}

/** Mini tarjeta "Inspirado en": miniatura del original (o un frasco), nombre y qué tan parecido es. */
/** Alto de la mini tarjeta "Inspirado en": los híbridos usan un poco más (miniaturas en fila y nombre en 2 renglones). */
const inspirationCardHeight = (insp: Inspiration) => (inspirationRefs(insp).length > 1 ? 104 : 84);

async function drawInspiration(ctx: CanvasRenderingContext2D, C: Palette, insp: Inspiration, x: number, y: number, w: number, h: number) {
  const sim = similarityOf(insp.similarity);
  const refs = inspirationRefs(insp).slice(0, 4);
  const hybrid = refs.length > 1;
  ctx.fillStyle = alpha(C.bg, 0.72);
  roundRect(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = C.cork;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Miniaturas: un original = cuadro; híbrido = una al lado de otra (frasco completo, sin recortar)
  const th = h - 18;
  const tw = hybrid ? 50 : th;
  const gap = 5;
  const tx = x + 9;
  const ty = y + 9;
  const thumbs = await Promise.all(refs.map((r) => loadImage(r.image)));
  refs.forEach((_, k) => {
    const cx = tx + k * (tw + gap);
    ctx.save();
    roundRect(ctx, cx, ty, tw, th, 12);
    ctx.fillStyle = C.bark;
    ctx.fill();
    ctx.clip();
    const img = thumbs[k];
    if (img) {
      const pad = 5;
      const sc = Math.min((tw - pad * 2) / img.width, (th - pad * 2) / img.height);
      ctx.drawImage(img, cx + (tw - img.width * sc) / 2, ty + (th - img.height * sc) / 2, img.width * sc, img.height * sc);
    } else {
      ctx.textAlign = 'center';
      ctx.font = `${Math.round(Math.min(tw, th) * 0.5)}px ${FONT}`;
      ctx.fillText('🧴', cx + tw / 2, ty + th / 2 + Math.min(tw, th) * 0.18);
    }
    ctx.restore();
  });

  const left = tx + refs.length * (tw + gap) + 9;
  const maxW = x + w - left - 12;
  const fit = (text: string) => {
    let t = text;
    while (ctx.measureText(t).width > maxW && t.length > 4) t = t.slice(0, -2) + '…';
    return t;
  };
  ctx.textAlign = 'left';
  ctx.fillStyle = C.ember;
  ctx.font = `500 13px ${FONT}`;
  ctx.fillText(hybrid ? `✨ HÍBRIDO · INSPIRADO EN ${refs.length}` : '✨ INSPIRADO EN', left, y + 26);

  ctx.fillStyle = C.cream;
  ctx.font = `500 ${hybrid ? 18 : 20}px ${FONT}`;
  let lineY = y + 52;
  const lines = hybrid ? wrap(ctx, inspirationTitle(insp), maxW) : [inspirationTitle(insp)];
  const shown = lines.slice(0, 2);
  if (lines.length > 2) shown[1] = `${shown[1]} …`;
  shown.forEach((ln, k) => {
    ctx.fillText(fit(ln), left, lineY);
    if (k < shown.length - 1) lineY += 22;
  });

  const dotsY = lineY + (hybrid ? 22 : 18);
  let dx = left;
  for (let n = 1; n <= 3; n++) {
    ctx.fillStyle = n <= sim.dots ? C.ember : C.cork;
    ctx.beginPath();
    ctx.arc(dx + 4, dotsY - 5, 4, 0, Math.PI * 2);
    ctx.fill();
    dx += 13;
  }
  ctx.fillStyle = C.sand;
  ctx.font = `400 15px ${FONT}`;
  // En híbridos, después del parecido van las casas: "Similar · Escentric Molecules · Nishane"
  let line = hybrid && inspirationBrands(insp) ? `${sim.label} · ${inspirationBrands(insp)}` : sim.label;
  while (ctx.measureText(line).width > x + w - (dx + 6) - 12 && line.length > 4) line = line.slice(0, -2) + '…';
  ctx.fillText(line, dx + 6, dotsY);
}

export async function renderFichaImage(f: Fragrance, config: StoreConfig, sizes: SizeConfig[], formatPrice: (n: number) => string): Promise<Blob> {
  const C = activePalette();
  const W = 1080;
  const H = 1350;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d');
  if (!ctx) throw new Error('Canvas no disponible');

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, C.bg2);
  bg.addColorStop(1, C.bg);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(270, 340, 20, 270, 340, 340);
  glow.addColorStop(0, alpha(C.ember, 0.22));
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 700);

  ctx.strokeStyle = C.cork;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  roundRect(ctx, 32, 32, W - 64, H - 64, 34);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.textAlign = 'left';
  ctx.fillStyle = C.cream;
  ctx.font = `500 22px ${FONT}`;
  ctx.fillText((config.name || 'JS FRAGANCES').toUpperCase(), 72, 92);
  ctx.textAlign = 'right';
  ctx.fillStyle = C.sand;
  ctx.font = `500 18px ${FONT}`;
  ctx.fillText('FICHA OLFATIVA • DECANTS & BOTELLAS', W - 72, 92);

  // Frasco
  ctx.fillStyle = alpha(C.bark, 0.45);
  roundRect(ctx, 72, 150, 370, 420, 28);
  ctx.fill();
  const insp = f.inspiration?.name ? f.inspiration : undefined;
  const areaH = 420;
  const bottle = await loadImage(f.image);
  if (bottle) {
    const ratio = Math.min(314 / bottle.width, (areaH - 56) / bottle.height);
    const dw = bottle.width * ratio;
    const dh = bottle.height * ratio;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.75)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 14;
    ctx.drawImage(bottle, 72 + (370 - dw) / 2, 150 + (areaH - dh) / 2, dw, dh);
    ctx.restore();
  }

  // Encabezado
  const rx = 475;
  const rw = W - rx - 72;
  const prof = profileOf(f);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.ember;
  ctx.font = `500 22px ${FONT}`;
  ctx.fillText((f.brand || 'CASA OLFATIVA').toUpperCase(), rx, 195);
  ctx.fillStyle = C.cream;
  ctx.font = `500 48px ${FONT}`;
  let ty = 252;
  for (const line of wrap(ctx, (f.name || 'Fragancia').toUpperCase(), rw).slice(0, insp ? 2 : 3)) {
    ctx.fillText(line, rx, ty);
    ty += 52;
  }

  ty += 8;
  let bx = rx;
  ctx.font = `500 18px ${FONT}`;
  for (const b of [f.concentration || 'EDP', f.gender || 'Unisex']) {
    const bw = ctx.measureText(b).width + 32;
    ctx.strokeStyle = C.cream;
    roundRect(ctx, bx, ty, bw, 38, 19);
    ctx.stroke();
    ctx.fillStyle = C.cream;
    ctx.fillText(b, bx + 16, ty + 25);
    bx += bw + 12;
  }

  ty += 62;
  const stats = [
    { k: 'DURACIÓN', v: prof.duracion },
    { k: 'ESTELA', v: prof.estela },
    { k: 'RATING', v: `★ ${prof.rating} / 5` },
  ];
  const colW = (rw - 20) / 3;
  stats.forEach((st, i) => {
    const sx = rx + i * (colW + 10);
    ctx.fillStyle = alpha(C.bark, 0.6);
    roundRect(ctx, sx, ty, colW, 84, 16);
    ctx.fill();
    ctx.fillStyle = C.sand;
    ctx.font = `500 13px ${FONT}`;
    ctx.fillText(st.k, sx + 14, ty + 28);
    ctx.fillStyle = i === 2 ? C.ember : C.cream;
    ctx.fillText(fitFont(ctx, String(st.v || ''), colW - 28, 500, 20, 15), sx + 14, ty + 62);
  });

  ty += 112;
  ctx.fillStyle = C.sand;
  ctx.font = `400 19px ${FONT}`;
  // Clima y Ocasión: en una línea si caben; si no, cada uno en la suya, siempre dentro de la ficha.
  const clima = `Clima: ${prof.clima.trim()}`;
  const ocasion = `Ocasión: ${prof.ocasion.trim()}`;
  const together = `${clima}   •   ${ocasion}`;
  if (ctx.measureText(together).width <= rw) ctx.fillText(together, rx, ty);
  else {
    ctx.fillText(fitWidth(ctx, clima, rw), rx, ty);
    // La ocasión puede ocupar hasta 2 renglones; lo que sobre termina en "…"
    const lines = wrap(ctx, ocasion, rw);
    lines.slice(0, 2).forEach((l, i) => {
      ty += 28;
      ctx.fillText(i === 1 && lines.length > 2 ? fitWidth(ctx, `${l} ${lines.slice(2).join(' ')}`, rw) : fitWidth(ctx, l, rw), rx, ty);
    });
  }

  // "Inspirado en…": mini tarjeta con la miniatura del original, debajo de Clima / Ocasión
  let py = 610;
  if (insp) {
    const cardTop = ty + 18;
    await drawInspiration(ctx, C, insp, rx, cardTop, rw, inspirationCardHeight(insp));
    py = Math.max(py, cardTop + inspirationCardHeight(insp) + 34);
  }
  // Si la pirámide se recorrió hacia abajo, sus filas se compactan para no tocar el pie.
  const shifted = py > 610;
  const rowGap = shifted ? 10 : 15;
  const rowH = shifted ? Math.max(152, Math.min(165, (H - 155 - 18 - (py + 24) - 2 * rowGap) / 3)) : 165;
  ctx.fillStyle = C.cream;
  ctx.font = `500 20px ${FONT}`;
  ctx.fillText('PIRÁMIDE OLFATIVA', 72, py);
  ctx.strokeStyle = C.cork;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(300, py - 7);
  ctx.lineTo(W - 72, py - 7);
  ctx.stroke();
  ctx.setLineDash([]);

  const pyramid = pyramidFor(f)!;
  const levels = [
    { label: 'NOTAS DE SALIDA', notes: pyramid.top, emo: '🌿' },
    { label: 'NOTAS DE CORAZÓN', notes: pyramid.mid, emo: '🌸' },
    { label: 'NOTAS DE FONDO', notes: pyramid.base, emo: '🪵' },
  ];
  py += 24;
  for (const lvl of levels) {
    ctx.fillStyle = alpha(C.bark, 0.35);
    roundRect(ctx, 72, py, W - 144, rowH, 22);
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.fillStyle = C.sand;
    ctx.font = `500 14px ${FONT}`;
    ctx.fillText(lvl.label, 96, py + 28);

    const shown = lvl.notes.slice(0, 6);
    if (!shown.length) {
      ctx.fillStyle = C.sand;
      ctx.font = `400 18px ${FONT}`;
      ctx.fillText('Acordes equilibrados de la casa', 96, py + 95);
    } else {
      const cardW = 132;
      const cardH = 112;
      const gap = 14;
      let nx = Math.max(96, (W - (shown.length * cardW + (shown.length - 1) * gap)) / 2);
      const ny = py + 40;
      for (const note of shown) {
        const img = await loadImage(note.img || guessImage(note.t));
        ctx.save();
        roundRect(ctx, nx, ny, cardW, cardH, 16);
        ctx.clip();
        ctx.fillStyle = C.bark;
        ctx.fillRect(nx, ny, cardW, cardH);
        if (img) {
          const sc = Math.max(cardW / img.width, cardH / img.height);
          ctx.drawImage(img, nx + (cardW - img.width * sc) / 2, ny + (cardH - img.height * sc) / 2, img.width * sc, img.height * sc);
        } else {
          ctx.font = '42px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(note.e || lvl.emo, nx + cardW / 2, ny + 62);
        }
        const ov = ctx.createLinearGradient(0, ny + 30, 0, ny + cardH);
        ov.addColorStop(0, 'rgba(0,0,0,0)');
        ov.addColorStop(1, 'rgba(0,0,0,0.88)');
        ctx.fillStyle = ov;
        ctx.fillRect(nx, ny, cardW, cardH);
        ctx.fillStyle = '#ffffff'; // siempre blanco: va sobre la sombra oscura de la foto
        ctx.font = `500 15px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText(clip(note.t, 15), nx + cardW / 2, ny + cardH - 12);
        ctx.restore();
        nx += cardW + gap;
      }
    }
    py += rowH + rowGap;
  }

  // Pie con precios
  const footY = H - 155;
  ctx.fillStyle = C.bark;
  roundRect(ctx, 72, footY, W - 144, 92, 22);
  ctx.fill();
  const priceList = sellableKeys(sizes)
    .map((k) => {
      const p = f.prices?.[k];
      return p && Number(p.price) > 0 ? `${sizeLabel(sizes, k)}: ${formatPrice(Number(p.price))}` : null;
    })
    .filter(Boolean)
    .slice(0, 4)
    .join('   •   ');
  ctx.textAlign = 'center';
  ctx.fillStyle = C.cream;
  ctx.font = `500 22px ${FONT}`;
  ctx.fillText(f.comingSoon ? '⏳ PRÓXIMAMENTE EN CATÁLOGO — APARTA TU AVISO' : priceList || 'Consulta disponibilidad y precios por WhatsApp', W / 2, footY + 40);
  ctx.fillStyle = C.sand;
  ctx.font = `400 17px ${FONT}`;
  ctx.fillText(`Pedidos WhatsApp: ${config.whatsapp || ''}   •   IG: ${config.instagram || ''}`, W / 2, footY + 72);

  const blob = await new Promise<Blob | null>((res) => cv.toBlob(res, 'image/png'));
  if (!blob) throw new Error('No se pudo exportar la imagen');
  return blob;
}

/** Comparte la ficha en móvil o la descarga en escritorio. */
export async function shareOrDownloadFicha(blob: Blob, f: Fragrance): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const fileName = `Ficha-${fragranceSlug(f) || 'perfume'}.png`;
  const file = new File([blob], fileName, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] }) && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
    try {
      await navigator.share({ files: [file], title: `${f.brand} - ${f.name}` });
      return 'shared';
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.download = fileName;
  a.href = url;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1500);
  return 'downloaded';
}
