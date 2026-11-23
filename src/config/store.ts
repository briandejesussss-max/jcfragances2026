import type { OrderStatus, Profile, SizeConfig, StoreConfig } from '@/models/types';

/** Valores por defecto de la tienda; los datos reales viven en la tabla `store_config`. */
export const DEFAULT_STORE_CONFIG: StoreConfig = {
  name: 'JS FRAGANCES',
  tagline: 'TU MUESTRA DE LUJO AL MEJOR PRECIO.',
  whatsapp: '+52 866 406 0130',
  instagram: '@JSFRAGANCES2026',
  instagramUrl: 'https://www.instagram.com/jsfragances2026',
  notes: 'Envios express a toda la república',
  logo: '',
  lowMlThreshold: 15,
  sizes: [],
};

export const DEFAULT_SIZES: SizeConfig[] = [
  { key: '3ml', label: '3 ml', ml: 3, kind: 'decant' },
  { key: '5ml', label: '5 ml', ml: 5, kind: 'decant' },
  { key: '10ml', label: '10 ml', ml: 10, kind: 'decant' },
];

/** Datos para transferencia que se muestran al cliente al confirmar su pedido. */
export const BANK = { clabe: '646195405600875512', holder: 'Jesus Sanchez', bank: 'STP' } as const;

/** Envío base; `extra` y `extendedZipCodes` = cargo y códigos postales de zona extendida. */
export const SHIPPING = { base: 180, extra: 0, extendedZipCodes: [] as string[] } as const;

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pendiente_pago: 'Pendiente de pago',
  pagado: 'Pagado',
  proveedor: 'Pedido con el proveedor',
  transito: 'En camino a México',
  recibido: 'Recibido en México',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export const PROFILE_DEFAULT: Profile = {
  duracion: '8-10 horas',
  rating: '4.8',
  estela: 'Fuerte',
  audiencia: 'Unisex',
  clima: 'Otoño/Invierno',
  ocasion: 'Citas, Noche',
  fuertes: 'Duración sobresaliente y estela memorable.',
  considerar: 'Salida potente; esperar unos minutos para el secado.',
};

export const PAGE_SIZE = 12;

export const STORAGE_BUCKET = 'fotos';

export const PLACEHOLDER_IMAGE = (name: string) =>
  'https://placehold.co/400x400/100904/ffedd7/png?text=' + encodeURIComponent(name);
