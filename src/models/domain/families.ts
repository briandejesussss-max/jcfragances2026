import type { Fragrance, PyramidNote } from '../types';

/**
 * Familias olfativas. Se detectan solas a partir de las notas que ya tiene cada perfume
 * (texto de notas y pirámide), así no hay que capturar nada nuevo en el panel.
 */

export type FamilyKey = 'frescos' | 'aromaticos' | 'dulces' | 'amaderados' | 'especiados' | 'ambarados' | 'oud' | 'florales' | 'frutales' | 'limpios';

export interface Family {
  key: FamilyKey;
  /** Nombre corto (chips, menú) */
  label: string;
  /** Frase para el cuestionario */
  hint: string;
  /** Dos colores que la representan */
  colors: [string, string];
  /** Palabras (sin acentos, minúsculas) que la delatan */
  words: string[];
}

export const FAMILIES: Family[] = [
  {
    key: 'frescos',
    label: 'Frescos y cítricos',
    hint: 'Limpio y ligero, como recién bañado',
    colors: ['#f5d90a', '#7fd6e8'],
    words: ['limon', 'bergamota', 'toronja', 'pomelo', 'naranja', 'mandarina', 'cidra', 'lima', 'yuzu', 'citric', 'marin', 'acuatic', 'algas', 'sal', 'calone', 'ozon', 'pepino', 'menta', 'mojito', 'lluvia', 'te verde'],
  },
  {
    key: 'aromaticos',
    label: 'Aromáticos',
    hint: 'Lavanda, romero y otras hierbas',
    colors: ['#3aa37a', '#a58be0'],
    words: ['lavanda', 'lavandin', 'romero', 'salvia', 'esclarea', 'albahaca', 'geranio', 'eucalipto', 'herbal', 'hierba', 'notas verdes', 'bambu', 'te negro', 'te oolong', 'artemisa', 'tomillo', 'enebro', 'gin'],
  },
  {
    key: 'dulces',
    label: 'Dulces y avainillados',
    hint: 'Cálido, envolvente y antojable',
    colors: ['#f2e2a0', '#e2554f'],
    words: ['vainilla', 'haba tonka', 'tonka', 'caramelo', 'praline', 'miel', 'chocolate', 'cacao', 'azucar', 'malvavisco', 'natilla', 'crema', 'pastel', 'goma de mascar', 'cafe', 'almendra', 'castana', 'dulce', 'leche', 'cana de azucar', 'coco'],
  },
  {
    key: 'amaderados',
    label: 'Amaderados',
    hint: 'Elegante y seco, con carácter',
    colors: ['#8a5a2b', '#5a3a1e'],
    words: ['cedro', 'sandalo', 'vetiver', 'pachuli', 'gaiac', 'gaia', 'madera', 'amaderad', 'woody', 'cachemira', 'cipres', 'pino', 'abeto', 'abedul', 'roble', 'musgo', 'iso e super', 'akigalawood', 'georgywood', 'amberwood', 'cipriol'],
  },
  {
    key: 'especiados',
    label: 'Especiados',
    hint: 'Canela y pimienta, cálido',
    colors: ['#c2410c', '#e8a33a'],
    words: ['canela', 'pimienta', 'cardamomo', 'jengibre', 'nuez moscada', 'clavo', 'azafran', 'comino', 'timur', 'wasabi', 'especiad', 'picante', 'sichuan'],
  },
  {
    key: 'ambarados',
    label: 'Ambarados',
    hint: 'Ámbar y resinas, cálido y elegante',
    colors: ['#d97706', '#b8875a'],
    words: ['ambar', 'ambroxan', 'ambrofix', 'ambrarome', 'incienso', 'olibano', 'olivano', 'benjui', 'ladano', 'labdano', 'mirra', 'elemi', 'resina', 'copal'],
  },
  {
    key: 'oud',
    label: 'Oud, cuero y tabaco',
    hint: 'Intenso y profundo, deja huella',
    colors: ['#6b4f3a', '#3d2b22'],
    words: ['oud', 'cuero', 'tabaco', 'gamuza', 'humo', 'ron', 'whisky', 'mezcal', 'gasolina', 'agarwood'],
  },
  {
    key: 'florales',
    label: 'Florales',
    hint: 'Rosa, jazmín y flores blancas',
    colors: ['#f472b6', '#f9e2ec'],
    words: ['rosa', 'jazmin', 'jasmin', 'iris', 'lirio', 'magnolia', 'tuberosa', 'peonia', 'violeta', 'azahar', 'neroli', 'gardenia', 'ylang', 'orquidea', 'osmanto', 'osmanthus', 'heliotropo', 'mimosa', 'fresia', 'flor', 'floral', 'frangipani', 'narciso', 'loto', 'flores'],
  },
  {
    key: 'frutales',
    label: 'Frutales',
    hint: 'Jugoso y alegre',
    colors: ['#ef4444', '#fb923c'],
    words: ['manzana', 'pera', 'pina', 'cereza', 'frambuesa', 'grosella', 'durazno', 'melocoton', 'ciruela', 'higo', 'mango', 'fresa', 'frutos rojos', 'lichi', 'maracuya', 'melon', 'sandia', 'papaya', 'guayaba', 'platano', 'mora', 'carambola', 'guanabana', 'mangostan', 'afrutad', 'frutal'],
  },
  {
    key: 'limpios',
    label: 'Suaves y limpios',
    hint: 'Almizcle y talco, cerca de la piel',
    colors: ['#e5e7eb', '#a5b4fc'],
    words: ['almizcle', 'musk', 'ambreta', 'ambrette', 'atalcad', 'talco', 'jabon', 'algodon', 'aldehid', 'raiz de lirio'],
  },
];

export const FAMILY_BY_KEY = new Map(FAMILIES.map((f) => [f.key, f]));

/** Texto sin acentos, en minúsculas y sin emojis. */
export const plain = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s,.\-]/gu, ' ');

const notesTextOf = (f: Pick<Fragrance, 'notes'> & { pyramid?: { top?: PyramidNote[]; mid?: PyramidNote[]; base?: PyramidNote[] } }) =>
  plain([f.notes ?? '', ...['top', 'mid', 'base'].flatMap((k) => (f.pyramid?.[k as 'top'] ?? []).map((n) => n.t))].join(' , '));

/** Inicio de palabra (palabras cortas: palabra completa, para que "sal" no cuente en "salvia"). */
const hit = (text: string, word: string) =>
  new RegExp(`(^|[^a-z])${word.replace(/ /g, '\\s+')}${word.length <= 4 ? '([^a-z]|$)' : ''}`).test(text);

/**
 * Familias del perfume, de la más presente a la menos (máximo 4).
 * Cuenta cuántas notas de cada familia aparecen.
 */
export function familiesOf(f: Pick<Fragrance, 'notes'> & { pyramid?: Fragrance['pyramid'] }): FamilyKey[] {
  const text = notesTextOf(f).replace(/notas de (salida|corazon|fondo)/g, ' ');
  return FAMILIES.map((fam) => ({ key: fam.key, n: fam.words.filter((w) => hit(text, w)).length * (fam.key === 'oud' ? 2 : 1) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 4)
    .map((x) => x.key);
}

/** Etiqueta para el link /familia/<key> */
export const familyHref = (k: FamilyKey) => `/familia/${k}`;
