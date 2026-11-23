import { DEFAULT_SIZES } from '@/config/store';
import { formatMl, round1 } from '@/lib/utils/format';
import type { BottlePrice, CartLine, Fragrance, OrderItem, SizeConfig, SizeKind, SizePrice, StoreConfig } from '../types';

/**
 * Reglas de presentaciones, precios e inventario.
 * Funciones puras: las usan el servidor (al crear pedidos) y la tienda (al mostrar botones).
 */

export const BOTTLE = 'bottle';

export const sizesOf = (config: Pick<StoreConfig, 'sizes'>): SizeConfig[] =>
  Array.isArray(config.sizes) && config.sizes.length ? config.sizes : DEFAULT_SIZES;

export function sizeInfo(sizes: SizeConfig[], key: string): SizeConfig | { key: string; label: string; ml: number; kind: 'bottle' } {
  const found = sizes.find((s) => s.key === key);
  if (found) return found;
  if (key === BOTTLE) return { key: BOTTLE, label: 'Botella', ml: 0, kind: 'bottle' };
  return { key, label: key, ml: parseInt(key, 10) || 0, kind: 'decant' };
}

export const mlOf = (sizes: SizeConfig[], key: string) => Number(sizeInfo(sizes, key).ml) || 0;
export const sizeLabel = (sizes: SizeConfig[], key: string) => (key === BOTTLE ? 'Botella' : sizeInfo(sizes, key).label);
export const isUnitKind = (kind: string | undefined) => kind === 'pieza' || kind === 'parcial';
export const isDecant = (sizes: SizeConfig[], key: string) => key !== BOTTLE && !isUnitKind(sizeInfo(sizes, key).kind);

/** Todas las presentaciones que se venden, en orden, más la botella completa. */
export const sellableKeys = (sizes: SizeConfig[]) => [...sizes.map((s) => s.key), BOTTLE];

export const sizePrice = (f: Fragrance, key: string): SizePrice | undefined =>
  key === BOTTLE ? undefined : (f.prices?.[key] as SizePrice | undefined);

export const bottlePrice = (f: Fragrance): BottlePrice | undefined => f.prices?.bottle;

export const isTesterBottle = (f: Fragrance | undefined) => bottlePrice(f as Fragrance)?.type === 'tester';

export function partialLabel(sizes: SizeConfig[], f: Fragrance, key: string): string {
  const info = sizeInfo(sizes, key);
  const ml = Number(sizePrice(f, key)?.ml);
  if (key !== BOTTLE && info.kind === 'parcial' && ml > 0) return `${sizeLabel(sizes, key)} · ${formatMl(ml)} ml`;
  return sizeLabel(sizes, key);
}

/** Nombre corto de la presentación para botones, carrito y mensajes. */
export function presentationLabel(sizes: SizeConfig[], f: Fragrance, key: string, long = false): string {
  if (key === BOTTLE) {
    if (isTesterBottle(f)) return long ? 'Botella Tester' : '🧪 Tester';
    return long ? 'Botella Completa' : 'Botella';
  }
  return partialLabel(sizes, f, key);
}

export function minSizePrice(sizes: SizeConfig[], f: Fragrance): number {
  const values = sizes.map((s) => Number(sizePrice(f, s.key)?.price) || 0).filter((v) => v > 0);
  return values.length ? Math.min(...values) : 0;
}

export const hasMlStock = (f: Fragrance) => Number.isFinite(f.stock?.ml);
export const hasBottleStock = (f: Fragrance) => Number.isFinite(f.stock?.bottles);

/** Es bajo pedido: no descuenta inventario. */
export function isOnDemand(f: Fragrance, key: string): boolean {
  if (key === BOTTLE) return !!bottlePrice(f)?.onDemand;
  return sizePrice(f, key)?.mode === 'pedido';
}

export interface Reserved {
  ml: number;
  bottles: number;
  pieces: Record<string, number>;
}

export const NO_RESERVATION: Reserved = { ml: 0, bottles: 0, pieces: {} };

/** Lo que ya está apartado en el carrito para una fragancia (lo bajo pedido no aparta). */
export function reservedFor(lines: CartLine[], f: Fragrance, sizes: SizeConfig[]): Reserved {
  const r: Reserved = { ml: 0, bottles: 0, pieces: {} };
  for (const l of lines) {
    if (l.fragId !== f.id || isOnDemand(f, l.size)) continue;
    if (l.size === BOTTLE) r.bottles += l.qty;
    else if (isUnitKind(sizeInfo(sizes, l.size).kind)) r.pieces[l.size] = (r.pieces[l.size] ?? 0) + l.qty;
    else r.ml += mlOf(sizes, l.size) * l.qty;
  }
  return r;
}

export const availableMl = (f: Fragrance, reserved: Reserved = NO_RESERVATION) =>
  hasMlStock(f) ? Math.max(0, round1((f.stock!.ml as number) - reserved.ml)) : Infinity;

export interface SizeState {
  ok: boolean;
  /** Presentación oculta: no se muestra */
  hidden?: boolean;
  onDemand?: boolean;
  /** Bajo pedido sin precio: se cotiza por WhatsApp */
  noPrice?: boolean;
  price: number;
  /** Texto cuando no se puede comprar */
  unavailableLabel?: 'Agotado' | 'N/D' | 'Sin ml' | '—';
  reason?: string;
  eta?: string;
}

/**
 * Estado de compra de una presentación. `reserved` descuenta lo que ya está en el carrito
 * (pásalo vacío para validar un pedido completo contra el inventario).
 */
export function sizeState(f: Fragrance, key: string, sizes: SizeConfig[], reserved: Reserved = NO_RESERVATION): SizeState {
  if (key !== BOTTLE) {
    const p = sizePrice(f, key) ?? { price: 0, inStock: true };
    const price = Number(p.price) || 0;
    if (p.mode === 'oculto') return { ok: false, hidden: true, price, unavailableLabel: '—', reason: 'Presentación no disponible' };
    if (p.mode === 'pedido') return { ok: true, onDemand: true, noPrice: !(price > 0), price, eta: p.eta, reason: 'Disponible por encargo especial' };
    if (!p.inStock || !(price > 0)) return { ok: false, price, unavailableLabel: 'Agotado', reason: 'Opción no disponible' };

    const kind = sizeInfo(sizes, key).kind as SizeKind;
    if (isUnitKind(kind)) {
      const n = f.stock?.pieces?.[key];
      if (Number.isFinite(n) && (n as number) - (reserved.pieces[key] ?? 0) < 1)
        return { ok: false, price, unavailableLabel: 'Agotado', reason: 'Sin piezas en stock' };
    } else if (hasMlStock(f)) {
      const a = availableMl(f, reserved);
      if (a < mlOf(sizes, key))
        return {
          ok: false,
          price,
          unavailableLabel: a <= 0 ? 'Agotado' : 'Sin ml',
          reason: a <= 0 ? 'Decants agotados' : `Solo quedan ${formatMl(a)} ml`,
        };
    }
    return { ok: true, price };
  }

  const b = bottlePrice(f) ?? { price: 0, inStock: false };
  const price = Number(b.price) || 0;
  if (b.onDemand) return { ok: true, onDemand: true, noPrice: !(price > 0), price, eta: b.eta, reason: 'Disponible por encargo especial' };
  if (!b.inStock || !(price > 0)) return { ok: false, price, unavailableLabel: 'N/D', reason: 'Opción no disponible' };
  if (hasBottleStock(f) && (f.stock!.bottles as number) - reserved.bottles < 1)
    return { ok: false, price, unavailableLabel: 'Agotado', reason: 'Sin piezas en stock' };
  return { ok: true, price };
}

/** Avisos de inventario para la tarjeta (pocos ml, última botella, tester). */
export function stockNotices(f: Fragrance, sizes: SizeConfig[], lowMlThreshold: number, reserved: Reserved): string[] {
  const out: string[] = [];
  if (isTesterBottle(f) && Number(bottlePrice(f)?.price) > 0) out.push('🧪 La botella completa es versión tester (no de línea)');
  if (hasMlStock(f) && sizes.some((s) => isDecant(sizes, s.key) && Number(sizePrice(f, s.key)?.price) > 0)) {
    const a = availableMl(f, reserved);
    if (a <= 0) out.push('🚫 Decants agotados');
    else if (a <= lowMlThreshold) out.push(`⚠️ Pocos ml disponibles: solo ${formatMl(a)} ml`);
  }
  if (hasBottleStock(f) && bottlePrice(f)?.inStock && (f.stock!.bottles as number) - reserved.bottles === 1)
    out.push('⚠️ Última botella disponible');
  return out;
}

/** Problemas de existencias de un pedido completo frente al inventario actual. */
export function stockIssues(lines: CartLine[], byId: Map<string, Fragrance>, sizes: SizeConfig[]): string[] {
  const out: string[] = [];
  const grouped = new Map<string, CartLine[]>();
  for (const l of lines) grouped.set(l.fragId, [...(grouped.get(l.fragId) ?? []), l]);

  for (const [id, group] of grouped) {
    const f = byId.get(id);
    if (!f) {
      out.push('Una fragancia de tu bolsa ya no está disponible');
      continue;
    }
    const name = `${f.brand} ${f.name}`;
    for (const l of group) {
      if (!sizeState(f, l.size, sizes).ok) out.push(`${name} (${l.size === BOTTLE ? 'botella' : sizeLabel(sizes, l.size)}): ya no disponible`);
    }
    const need = reservedFor(group, f, sizes);
    if (hasMlStock(f) && need.ml > (f.stock!.ml as number))
      out.push(`${name}: pides ${formatMl(need.ml)} ml y quedan ${formatMl(f.stock!.ml as number)} ml`);
    if (hasBottleStock(f) && need.bottles > (f.stock!.bottles as number))
      out.push(`${name}: pides ${need.bottles} pieza(s) y quedan ${f.stock!.bottles}`);
    for (const [k, qty] of Object.entries(need.pieces)) {
      const have = f.stock?.pieces?.[k];
      if (Number.isFinite(have) && qty > (have as number)) out.push(`${name}: pides ${qty} ${sizeLabel(sizes, k)} y quedan ${have}`);
    }
  }
  return out;
}

/** Descuenta del inventario un renglón de pedido (lo bajo pedido no descuenta). Devuelve una copia. */
export function deductItem(f: Fragrance, item: OrderItem, sizes: SizeConfig[]): Fragrance {
  if (item.onDemand) return f;
  const stock = { ...(f.stock ?? {}), pieces: { ...(f.stock?.pieces ?? {}) } };
  if (item.size === BOTTLE) {
    if (Number.isFinite(stock.bottles)) stock.bottles = Math.max(0, (stock.bottles as number) - item.qty);
  } else if (isUnitKind(item.kind === 'bottle' ? undefined : item.kind || sizeInfo(sizes, item.size).kind)) {
    const n = stock.pieces[item.size];
    if (Number.isFinite(n)) stock.pieces[item.size] = Math.max(0, n - item.qty);
  } else if (Number.isFinite(stock.ml)) {
    stock.ml = Math.max(0, round1((stock.ml as number) - (Number(item.ml) || mlOf(sizes, item.size)) * item.qty));
  }
  return { ...f, stock };
}
