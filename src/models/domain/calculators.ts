/** Calculadoras del panel. Solo calculan: no guardan ni generan facturas. */

// ---------- Calculadora de precio de importación ----------

export interface PriceCalcInput {
  rate: number; // MXN por USD
  price: number; // precio de lista USD
  discountPct: number;
  coupon: number;
  couponType: 'pct' | 'usd';
  taxPct: number;
  qty: number;
  weightKg: number; // por pieza
  crossingMode: 'peso' | 'pct';
  crossingManual: string; // vacío = automático por peso
  crossingPct: number;
  feeUsd: number; // ganancia fija por pieza
  extraUsd: number;
  extraMxn: number;
  round: number;
}

export const PRICE_CALC_DEFAULTS: PriceCalcInput = {
  rate: 20,
  price: 0,
  discountPct: 0,
  coupon: 0,
  couponType: 'pct',
  taxPct: 0,
  qty: 1,
  weightKg: 0.5,
  crossingMode: 'peso',
  crossingManual: '',
  crossingPct: 15,
  feeUsd: 0,
  extraUsd: 0,
  extraMxn: 0,
  round: 0,
};

/** Cruce automático según el peso total (kg). */
export function autoCrossing(kg: number): number {
  if (kg <= 0) return 0;
  if (kg <= 1) return 200;
  if (kg <= 3) return 300;
  if (kg <= 5) return 400;
  if (kg < 6) return 500;
  if (kg <= 10) return Math.floor(kg) * 100;
  return 1000;
}

export interface PriceCalcResult {
  total: number;
  perPiece: number;
  totalUsd: number;
  subtotalUsd: number;
  subtotalMxn: number;
  pageDiscountUsd: number;
  couponUsd: number;
  tax: number;
  fee: number;
  crossing: number;
  extras: number;
  totalWeight: number;
  crossingIsManual: boolean;
  autoCrossingValue: number;
  needsQuote: boolean;
}

export function calcImportPrice(i: PriceCalcInput): PriceCalcResult | null {
  const qty = Math.max(1, Math.floor(i.qty) || 1);
  const disc = Math.min(100, Math.max(0, i.discountPct));
  const totalWeight = i.weightKg * qty;
  const crossingIsManual = i.crossingManual.trim() !== '';
  const autoCrossingValue = autoCrossing(totalWeight);
  if (!(i.price > 0)) return null;

  const sub0 = i.price * (1 - disc / 100) * qty;
  const coupon = Math.max(0, i.coupon);
  const subtotalUsd = i.couponType === 'pct' ? sub0 * (1 - Math.min(100, coupon) / 100) : Math.max(0, sub0 - coupon);
  const subtotalMxn = subtotalUsd * i.rate;
  const fee = i.feeUsd * qty * i.rate;
  const tax = (subtotalMxn * Math.max(0, i.taxPct)) / 100;
  const crossing =
    i.crossingMode === 'pct' ? (subtotalMxn * Math.max(0, i.crossingPct)) / 100 : crossingIsManual ? parseFloat(i.crossingManual) || 0 : autoCrossingValue;
  const extras = i.extraUsd * i.rate + i.extraMxn;
  let total = subtotalMxn + tax + fee + crossing + extras;
  if (i.round > 0) total = Math.ceil(total / i.round - 1e-9) * i.round;

  return {
    total,
    perPiece: total / qty,
    totalUsd: i.rate > 0 ? total / i.rate : 0,
    subtotalUsd,
    subtotalMxn,
    pageDiscountUsd: (i.price * qty * disc) / 100,
    couponUsd: sub0 - subtotalUsd,
    tax,
    fee,
    crossing,
    extras,
    totalWeight,
    crossingIsManual,
    autoCrossingValue,
    needsQuote: i.crossingMode === 'peso' && totalWeight > 10 && !crossingIsManual,
  };
}

// ---------- Calculadora de costo de decants ----------

export type ProfitMode = 'ml' | 'pct' | 'margin' | 'fixed';

export const PROFIT_LABEL: Record<ProfitMode, string> = {
  ml: 'Ganancia por ml ($)',
  pct: 'Ganancia sobre el costo (%)',
  margin: 'Margen sobre la venta (%)',
  fixed: 'Ganancia fija por decant ($)',
};

export interface DecantExtra {
  name: string;
  amount: number;
  scope: 'decant' | 'bottle';
}

export interface DecantCalcInput {
  name: string;
  bottlePrice: number;
  bottleMl: number;
  bottleExtra: number;
  waste: number;
  supplies: { 3: number; 5: number; 10: number };
  extras: DecantExtra[];
  profitMode: ProfitMode;
  profitValue: number;
  round: number;
  customMl: number;
  customSupplies: number;
}

export const DECANT_CALC_DEFAULTS: DecantCalcInput = {
  name: '',
  bottlePrice: 0,
  bottleMl: 0,
  bottleExtra: 0,
  waste: 0,
  supplies: { 3: 0, 5: 0, 10: 0 },
  extras: [],
  profitMode: 'ml',
  profitValue: 0,
  round: 5,
  customMl: 0,
  customSupplies: 0,
};

export interface DecantRow {
  ml: number;
  custom: boolean;
  cost: number;
  sale: number;
  profit: number;
  margin: number;
  perMl: number;
  count: number;
  netAll: number;
  breakEven: number | null;
}

export interface DecantCalcResult {
  totalBottle: number;
  extraDecant: number;
  sellable: number;
  costPerMl: number;
  rows: DecantRow[];
}

const pos = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

export function calcDecants(i: DecantCalcInput): DecantCalcResult | null {
  const extraBottle = pos(i.bottleExtra) + i.extras.filter((x) => x.scope === 'bottle').reduce((a, x) => a + pos(x.amount), 0);
  const extraDecant = i.extras.filter((x) => x.scope === 'decant').reduce((a, x) => a + pos(x.amount), 0);
  const totalBottle = pos(i.bottlePrice) + extraBottle;
  const sellable = Math.max(pos(i.bottleMl) - pos(i.waste), 0);
  if (!(pos(i.bottlePrice) > 0) || !(sellable > 0)) return null;
  const costPerMl = totalBottle / sellable;
  const value = pos(i.profitValue);

  const sizes = [
    { ml: 3, supplies: pos(i.supplies[3]), custom: false },
    { ml: 5, supplies: pos(i.supplies[5]), custom: false },
    { ml: 10, supplies: pos(i.supplies[10]), custom: false },
  ];
  if (pos(i.customMl) > 0) sizes.push({ ml: pos(i.customMl), supplies: pos(i.customSupplies), custom: true });

  const rows = sizes.map((s): DecantRow => {
    const cost = costPerMl * s.ml + s.supplies + extraDecant;
    let sale = cost;
    if (i.profitMode === 'pct') sale = cost * (1 + value / 100);
    else if (i.profitMode === 'margin') sale = value < 100 ? cost / (1 - value / 100) : cost;
    else if (i.profitMode === 'ml') sale = cost + value * s.ml;
    else if (i.profitMode === 'fixed') sale = cost + value;
    if (i.round > 0) sale = Math.ceil(sale / i.round - 1e-9) * i.round;
    const profit = sale - cost;
    const count = Math.floor(sellable / s.ml + 1e-9);
    const perDecantNet = sale - s.supplies - extraDecant;
    return {
      ml: s.ml,
      custom: s.custom,
      cost,
      sale,
      profit,
      margin: sale > 0 ? (profit / sale) * 100 : 0,
      perMl: s.ml ? sale / s.ml : 0,
      count,
      netAll: count * sale - (totalBottle + count * (s.supplies + extraDecant)),
      breakEven: perDecantNet > 0 && totalBottle > 0 ? Math.ceil(totalBottle / perDecantNet) : null,
    };
  });

  return { totalBottle, extraDecant, sellable, costPerMl, rows };
}
