/** Paletas de color de la tienda. La primera es la predeterminada (sin atributo en <html>). */
export const PALETTES = [
  { key: 'oled', label: 'OLED negro', swatch: '#000000' },
  { key: 'medianoche', label: 'Azul medianoche', swatch: '#0a1128' },
  { key: 'blanco', label: 'Blanco', swatch: '#f6f4ef' },
  { key: 'grafito', label: 'Grafito', swatch: '#121316' },
  { key: 'cafe', label: 'Café', swatch: '#382416' },
] as const;

export type PaletteKey = (typeof PALETTES)[number]['key'];

export const PALETTE_STORAGE_KEY = 'jf26_palette';

/** Se ejecuta antes de pintar para aplicar la paleta guardada sin parpadeo. */
export const PALETTE_BOOT_SCRIPT = `try{var p=localStorage.getItem('${PALETTE_STORAGE_KEY}');if(p&&p!=='oled')document.documentElement.setAttribute('data-palette',p)}catch(e){}`;
