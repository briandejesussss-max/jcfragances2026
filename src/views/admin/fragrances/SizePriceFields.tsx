'use client';

import { isUnitKind } from '@/models/domain/sizes';
import type { BottlePrice, Fragrance, SizeConfig, SizePrice, Stock } from '@/models/types';
import { Checkbox, Input, Label, Select } from '@/views/shared/Field';
import { cn } from '@/lib/utils/cn';

interface Props {
  sizes: SizeConfig[];
  prices: Fragrance['prices'];
  stock: Stock | undefined;
  onPrices: (p: Fragrance['prices']) => void;
  onStock: (s: Stock | undefined) => void;
}

const num = (v: string) => (v === '' ? 0 : parseFloat(v) || 0);

/** Precios por presentación (venta normal, oculta o bajo pedido) y botella completa. */
export function SizePriceFields({ sizes, prices, stock, onPrices, onStock }: Props) {
  const sizeP = (k: string) => (prices[k] as SizePrice | undefined) ?? { price: 0, inStock: true };
  const bottle: BottlePrice = prices.bottle ?? { price: 0, inStock: false, type: 'linea' };

  const setSize = (k: string, patch: Partial<SizePrice> & { mode?: SizePrice['mode'] | 'normal' }) => {
    const next: SizePrice = { ...sizeP(k), ...patch } as SizePrice;
    if ((patch.mode as string) === 'normal') {
      delete next.mode;
      delete next.eta;
    }
    onPrices({ ...prices, [k]: next });
  };
  const setBottle = (patch: Partial<BottlePrice>) => onPrices({ ...prices, bottle: { ...bottle, ...patch } });

  const setPieces = (k: string, v: string) => {
    const pieces = { ...(stock?.pieces ?? {}) };
    if (v === '') delete pieces[k];
    else pieces[k] = Math.max(0, Math.round(+v));
    onStock({ ...(stock ?? {}), pieces });
  };

  return (
    <div className="space-y-3">
      <Label>Precios por presentación</Label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {sizes.map((s) => {
          const p = sizeP(s.key);
          const unit = isUnitKind(s.kind);
          const partial = s.kind === 'parcial';
          return (
            <div key={s.key} className={cn('space-y-1.5 rounded-xl border p-2', unit ? 'border-sand/40' : 'border-cork')}>
              <span className="block text-[10px] font-medium uppercase">
                {s.label}
                {partial ? ' · parcial (usada)' : unit ? ' · pieza' : ''}
              </span>
              <Input type="number" min={0} step="any" value={p.price || ''} placeholder="$ 0" onChange={(e) => setSize(s.key, { price: num(e.target.value) })} />
              {partial && (
                <Input type="number" min={0} step={0.5} value={p.ml || ''} placeholder="ml que le quedan" onChange={(e) => setSize(s.key, { ml: num(e.target.value) })} />
              )}
              {unit && (
                <Input
                  type="number"
                  min={0}
                  value={Number.isFinite(stock?.pieces?.[s.key]) ? stock!.pieces![s.key] : ''}
                  placeholder={partial ? 'Piezas (1 = una botella)' : 'Piezas en stock'}
                  onChange={(e) => setPieces(s.key, e.target.value)}
                />
              )}
              {!partial && (
                <Select value={p.mode ?? 'normal'} onChange={(e) => setSize(s.key, { mode: e.target.value as SizePrice['mode'] })} className="py-1 text-[11px]">
                  <option value="normal">En venta normal</option>
                  <option value="oculto">Ocultar presentación</option>
                  <option value="pedido">Bajo pedido</option>
                </Select>
              )}
              {p.mode === 'pedido' && (
                <Input value={p.eta ?? ''} placeholder="Tiempo estimado (ej. 2 semanas)" onChange={(e) => setSize(s.key, { eta: e.target.value })} className="text-[11px]" />
              )}
              <Checkbox label="Disponible" checked={p.inStock !== false} onChange={(e) => setSize(s.key, { inStock: e.target.checked })} />
            </div>
          );
        })}
      </div>

      <div className="space-y-2 rounded-xl border border-cork p-3">
        <span className="block text-[10px] font-medium uppercase">Botella completa</span>
        <Input type="number" min={0} step="any" value={bottle.price || ''} placeholder="Precio de la botella (o dejar en 0)" onChange={(e) => setBottle({ price: num(e.target.value) })} />
        <div className="flex flex-wrap gap-4">
          <Checkbox label="Disponible" checked={!!bottle.inStock} onChange={(e) => setBottle({ inStock: e.target.checked })} />
          <Checkbox label="Bajo pedido" checked={!!bottle.onDemand} onChange={(e) => setBottle({ onDemand: e.target.checked })} />
          <label className="inline-flex items-center gap-2 text-xs text-sand">
            <input type="radio" name="bottle-type" checked={bottle.type !== 'tester'} onChange={() => setBottle({ type: 'linea' })} className="accent-ember" /> De línea
          </label>
          <label className="inline-flex items-center gap-2 text-xs text-sand">
            <input type="radio" name="bottle-type" checked={bottle.type === 'tester'} onChange={() => setBottle({ type: 'tester' })} className="accent-ember" /> Tester
          </label>
        </div>
        {bottle.onDemand && <Input value={bottle.eta ?? ''} placeholder="Si es bajo pedido: tiempo estimado (ej. 2 semanas)" onChange={(e) => setBottle({ eta: e.target.value })} />}
      </div>
    </div>
  );
}
