import { PROFILE_DEFAULT } from '@/config/store';
import type { Fragrance, Profile } from '../types';

export const PROFILE_FIELDS: Array<{ key: keyof Profile; placeholder: string; multiline?: boolean }> = [
  { key: 'duracion', placeholder: 'Duración (ej. 8-10 horas)' },
  { key: 'rating', placeholder: 'Calificación (ej. 4.8)' },
  { key: 'estela', placeholder: 'Estela (ej. Fuerte)' },
  { key: 'audiencia', placeholder: 'Audiencia (ej. Unisex)' },
  { key: 'clima', placeholder: 'Clima (ej. Otoño/Invierno)' },
  { key: 'ocasion', placeholder: 'Ocasión (separa con comas)' },
  { key: 'fuertes', placeholder: 'Puntos fuertes (uno por línea)', multiline: true },
  { key: 'considerar', placeholder: 'A considerar (uno por línea)', multiline: true },
];

/** Perfil comunitario con valores por defecto donde la fragancia no tiene dato. */
export function profileOf(f: Pick<Fragrance, 'profile'> | undefined): Profile {
  const own = Object.fromEntries(Object.entries(f?.profile ?? {}).filter(([, v]) => String(v ?? '').trim()));
  return { ...PROFILE_DEFAULT, ...own };
}

export const splitOccasions = (text: string) =>
  String(text)
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

export const splitLines = (text: string) =>
  String(text)
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean);
