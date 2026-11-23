'use client';

import { useMemo, useState } from 'react';
import { calcImportPrice, PRICE_CALC_DEFAULTS, type PriceCalcInput } from '@/models/domain/calculators';
import { Field, Input, Select } from '@/views/shared/Field';

const mx = (v: number) => `$${v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
const us = (v: number) => `$${v.toFixed(2)} USD`;

/** Calcula cuánto cobrar por un perfume importado: precio USD, descuentos, tax, cruce y ganancia. */
export function PriceCalculator({ usdRate }: { usdRate: number }) {
  const [i, setI] = useState<PriceCalcInput>({ ...PRICE_CALC_DEFAULTS, rate: usdRate || PRICE_CALC_DEFAULTS.rate });
  const r = useMemo(() => calcImportPrice(i), [i]);
  const n = (k: keyof PriceCalcInput) => (e: React.ChangeEvent<HTMLInputElement>) => setI((p) => ({ ...p, [k]: parseFloat(e.target.value) || 0 }));

  return (
    <section className="space-y-4 rounded-3xl border border-cork bg-umber p-4 sm:p-5">
      <h2 className="text-lg">Calculadora de precios</h2>
      <p className="text-[11px] text-sand">Solo calcula; no genera facturas ni guarda datos.</p>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Tipo de cambio (MXN por USD)" hint={usdRate ? `En vivo: $${usdRate.toFixed(2)}` : 'Manual (no se pudo consultar)'}>
          <Input type="number" step="0.01" value={i.rate || ''} onChange={n('rate')} />
        </Field>
        <Field label="Precio de lista (USD)">
          <Input type="number" step="any" value={i.price || ''} placeholder="Ej. 65" onChange={n('price')} />
        </Field>
        <Field label="Descuento de la página (%)">
          <Input type="number" value={i.discountPct || ''} onChange={n('discountPct')} />
        </Field>
        <Field label="Cupón de descuento">
          <div className="flex gap-1">
            <Input type="number" value={i.coupon || ''} placeholder="Ej. 30" onChange={n('coupon')} />
            <Select className="w-24" value={i.couponType} onChange={(e) => setI((p) => ({ ...p, couponType: e.target.value as 'pct' | 'usd' }))}>
              <option value="pct">%</option>
              <option value="usd">USD</option>
            </Select>
          </div>
        </Field>
        <Field label="Tax de la página (%)">
          <Input type="number" step="any" value={i.taxPct || ''} onChange={n('taxPct')} />
        </Field>
        <Field label="Cantidad">
          <Input type="number" min={1} value={i.qty} onChange={n('qty')} />
        </Field>
        <Field label="Peso por pieza (kg)">
          <Input type="number" step="0.1" value={i.weightKg || ''} onChange={n('weightKg')} />
        </Field>
        <Field label="Cómo cobro el cruce">
          <Select value={i.crossingMode} onChange={(e) => setI((p) => ({ ...p, crossingMode: e.target.value as 'peso' | 'pct' }))}>
            <option value="peso">Por peso (kg)</option>
            <option value="pct">Por % del ticket</option>
          </Select>
        </Field>
        {i.crossingMode === 'peso' ? (
          <Field label="Cruce (MXN)" hint={i.crossingManual.trim() ? '(manual)' : `(automático: ${mx(r?.autoCrossingValue ?? 0)})`}>
            <Input type="number" value={i.crossingManual} placeholder="Vacío = automático por peso" onChange={(e) => setI((p) => ({ ...p, crossingManual: e.target.value }))} />
          </Field>
        ) : (
          <Field label="Porcentaje sobre el ticket (%)">
            <Input type="number" value={i.crossingPct || ''} onChange={n('crossingPct')} />
          </Field>
        )}
        <Field label="Ganancia fija por pieza (USD)">
          <Input type="number" step="any" value={i.feeUsd || ''} onChange={n('feeUsd')} />
        </Field>
        <Field label="Otros gastos (USD)">
          <Input type="number" step="any" value={i.extraUsd || ''} onChange={n('extraUsd')} />
        </Field>
        <Field label="Otros gastos (MXN)">
          <Input type="number" step="any" value={i.extraMxn || ''} onChange={n('extraMxn')} />
        </Field>
        <Field label="Redondear total hacia arriba">
          <Select value={i.round} onChange={(e) => setI((p) => ({ ...p, round: Number(e.target.value) }))}>
            {[0, 1, 5, 10, 50].map((v) => (
              <option key={v} value={v}>
                {v ? `A $${v}` : 'Sin redondeo'}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {!r ? (
        <p className="py-2 text-center text-sm text-sand">Escribe el precio de lista en USD para ver el total.</p>
      ) : (
        <>
          <div className="rounded-2xl bg-cream p-4 text-walnut">
            <div className="text-[10px] font-medium uppercase tracking-[0.08em] opacity-80">Total a cobrar</div>
            <div className="text-2xl font-semibold">{mx(r.total)}</div>
            <div className="text-[11px] opacity-80">
              {i.rate > 0 && `≈ ${us(r.totalUsd)}`}
              {i.qty > 1 && ` · Por pieza: ${mx(r.perPiece)}`}
            </div>
          </div>
          <dl className="space-y-1 rounded-2xl border border-cork p-3 text-[11px]">
            <Row k="Precio de lista" v={`${us(i.price)}${i.qty > 1 ? ` × ${i.qty}` : ''}`} />
            {r.pageDiscountUsd > 0 && <Row k={`Descuento de la página (${i.discountPct}%)`} v={`− ${us(r.pageDiscountUsd)}`} />}
            {r.couponUsd > 0 && <Row k="Cupón" v={`− ${us(r.couponUsd)}`} />}
            <Row k="Subtotal con descuentos" v={`${us(r.subtotalUsd)} · ${mx(r.subtotalMxn)}`} />
            {r.tax > 0 && <Row k={`Tax de la página (${i.taxPct}%)`} v={mx(r.tax)} />}
            {r.fee > 0 && <Row k="Ganancia fija" v={mx(r.fee)} />}
            <Row k={i.crossingMode === 'pct' ? `Cruce e importación (${i.crossingPct}% del ticket)` : 'Cruce e importación (por peso)'} v={mx(r.crossing)} />
            {r.extras > 0 && <Row k="Otros gastos" v={mx(r.extras)} />}
            {i.crossingMode === 'peso' && <Row k="Peso total" v={`${r.totalWeight.toFixed(2)} kg`} />}
          </dl>
          {r.needsQuote && <p className="text-[11px] text-ember">Más de 10 kg: el cruce necesita cotización personalizada (aquí va el mínimo de $1,000).</p>}
        </>
      )}
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-sand">{k}</dt>
      <dd className="text-right">{v}</dd>
    </div>
  );
}
