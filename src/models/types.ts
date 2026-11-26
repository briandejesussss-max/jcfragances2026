/** Tipos del dominio. Reflejan el JSON guardado en las columnas `data` de Supabase. */

export type SizeKind = 'decant' | 'pieza' | 'parcial';

export interface SizeConfig {
  key: string;
  label: string;
  ml: number;
  kind: SizeKind;
  partial?: boolean;
}

/** Modo de venta de una presentación (no aplica a la botella completa). */
export type SizeMode = 'normal' | 'pedido' | 'oculto';

export interface SizePrice {
  price: number;
  inStock: boolean;
  /** Solo presentaciones "parcial": ml que le quedan a la botella usada. */
  ml?: number;
  mode?: Exclude<SizeMode, 'normal'>;
  eta?: string;
}

export interface BottlePrice {
  price: number;
  inStock: boolean;
  onDemand?: boolean;
  type?: 'linea' | 'tester';
  eta?: string;
}

export type Prices = Record<string, SizePrice | BottlePrice | undefined> & { bottle?: BottlePrice };

export interface Stock {
  ml?: number;
  bottles?: number;
  pieces?: Record<string, number>;
}

export interface PyramidNote {
  /** Emoji de respaldo */
  e: string;
  /** Texto de la nota */
  t: string;
  /** Foto opcional */
  img?: string;
}

export interface Pyramid {
  top: PyramidNote[];
  mid: PyramidNote[];
  base: PyramidNote[];
}

export type PyramidSection = keyof Pyramid;

export interface Profile {
  duracion: string;
  rating: string;
  estela: string;
  audiencia: string;
  clima: string;
  ocasion: string;
  fuertes: string;
  considerar: string;
}

export interface Fragrance {
  id: string;
  name: string;
  brand: string;
  concentration?: string;
  gender?: string;
  image?: string;
  bgImage?: string;
  notes?: string;
  comingSoon?: boolean;
  profile?: Partial<Profile>;
  pyramid?: Pyramid;
  prices: Prices;
  stock?: Stock;
}

/** Versión ligera para listados: sin pirámide ni foto de fondo. */
export type FragranceSummary = Omit<Fragrance, 'pyramid' | 'bgImage'> & { position: number };

export interface StoreConfig {
  name: string;
  tagline: string;
  whatsapp: string;
  instagram: string;
  instagramUrl?: string;
  notes: string;
  logo: string;
  lowMlThreshold: number;
  sizes: SizeConfig[];
}

export type OrderStatus =
  | 'pendiente_pago'
  | 'pagado'
  | 'proveedor'
  | 'transito'
  | 'recibido'
  | 'enviado'
  | 'entregado'
  | 'cancelado';

export interface Customer {
  name: string;
  phone: string;
  email: string;
  street: string;
  numExt: string;
  numInt: string;
  cp: string;
  colonia: string;
  city: string;
  state: string;
}

export interface OrderItem {
  fragId: string;
  brand: string;
  name: string;
  size: string;
  label: string;
  ml: number;
  kind: SizeKind | 'bottle';
  qty: number;
  price: number;
  onDemand: boolean;
  eta: string;
}

export interface OrderEvent {
  at: string;
  status: OrderStatus;
  note: string;
}

export interface Order {
  id: string;
  number: string;
  status: OrderStatus;
  customer: Customer;
  items: OrderItem[];
  total: number;
  shipping: number;
  discount: number;
  carrier: string | null;
  tracking: string | null;
  tracking_url: string | null;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  events: OrderEvent[];
  /** Cuenta del cliente que compró (null = compra sin cuenta) */
  user_id: string | null;
}

export type TrackedOrder = Pick<
  Order,
  'number' | 'status' | 'items' | 'total' | 'shipping' | 'discount' | 'carrier' | 'tracking' | 'tracking_url' | 'created_at' | 'events'
>;

export type MovementType = 'ingreso' | 'gasto';

export interface Movement {
  id: string;
  date: string;
  type: MovementType;
  category: string;
  amount: number;
  method: string;
  note: string;
  order_id: string | null;
  created_at: string;
}

export type MovementInput = Pick<Movement, 'date' | 'type' | 'category' | 'amount' | 'method' | 'note'>;

export type TaxBase = 'beneficio' | 'ingresos';

export interface AppSettings {
  taxReservePct: number;
  taxBase: TaxBase;
}

/** Perfil de un cliente con cuenta (tabla `profiles`). */
export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  /** Última dirección de entrega usada; se precarga en la siguiente compra */
  address: Partial<Customer>;
  notifyEmail: boolean;
}

/** Cliente con cuenta, como lo ve el panel. */
export interface CustomerAccount {
  id: string;
  email: string;
  name: string;
  phone: string;
  createdAt: string;
  lastSignInAt: string | null;
  ordersCount: number;
}

/** Persona que compró sin cuenta (pedidos agrupados por correo). */
export interface GuestBuyer {
  email: string;
  name: string;
  phone: string;
  ordersCount: number;
  /** Suma de sus pedidos no cancelados */
  total: number;
  lastOrderNumber: string;
  lastOrderAt: string;
  /** Ya tiene cuenta con ese correo, pero no ha agregado estos pedidos */
  hasAccount: boolean;
}

export type Longevity = 'poca' | 'media' | 'larga';
export type Sillage = 'suave' | 'moderada' | 'fuerte';

/** Reseña pública de un cliente (compra verificada). */
export interface Review {
  id: string;
  fragranceId: string;
  rating: number;
  longevity: Longevity | null;
  sillage: Sillage | null;
  comment: string;
  authorName: string;
  hidden: boolean;
  /** Tiene un pedido entregado con este perfume ("Compra verificada"). */
  verified: boolean;
  /** Espera aprobación del administrador (las reseñas sin compra). */
  pending: boolean;
  createdAt: string;
}

/** Promedio y número de reseñas visibles de un perfume. */
export interface ReviewStat {
  average: number;
  reviews: number;
}

/** Reseña propia del cliente (para "ya calificado" y editar). */
export type MyReview = Pick<Review, 'fragranceId' | 'rating' | 'longevity' | 'sillage' | 'comment' | 'hidden' | 'pending' | 'verified'>;

export type ReviewInput = Pick<Review, 'fragranceId' | 'rating' | 'longevity' | 'sillage' | 'comment'> & {
  /** Nombre para mostrar (si va vacío y hay sesión, se usa el de la cuenta). */
  name?: string;
  /** Identificador anónimo del navegador (para visitantes sin cuenta). */
  visitor?: string | null;
};

/** Línea del carrito guardada en el navegador: el precio se vuelve a calcular en el servidor. */
export interface CartLine {
  fragId: string;
  size: string;
  qty: number;
}

export type Currency = 'MXN' | 'USD';

/** Resultado estándar de las acciones del servidor. */
export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

/** Resumen de estadísticas del panel (función admin_stats). */
export interface AdminStats {
  days: number;
  totals: {
    visitors: number;
    page_views: number;
    product_views: number;
    add_to_cart: number;
    whatsapp_clicks: number;
    orders: number;
    paid_orders: number;
    revenue: number;
  };
  funnel: { visitors: number; viewed_product: number; added_to_cart: number; started_checkout: number; ordered: number };
  daily: Array<{ day: string; visitors: number; orders: number }>;
  sources: Array<{ source: string; visitors: number }>;
  fragrances: Array<{ id: string; name: string; brand: string; views: number; viewers: number; adds: number; sold: number }>;
}
