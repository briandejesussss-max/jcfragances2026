'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { applyDecantPricesAction } from '@/controllers/fragrance.controller';
import { calcDecants, DECANT_CALC_DEFAULTS, PROFIT_LABEL, type DecantCalcInput, type ProfitMode } from '@/models/domain/calculators';
import type { FragranceSummary } from '@/models/types';
import { Button } from '@/views/shared/Button';
import { Field, Input, Select } from '@/views/shared/Field';
import { useToast } from '@/views/shared/Toast';
import { usePersistentState } from '@/views/store/state/usePersistentState';
import { cn } from '@/lib/utils/cn';

const money = (n: number) => `$${(Math.round(n * 100) / 100).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Costo real de cada decant a partir del precio de la botella, insumos y ganancia deseada. Se guarda en este dispositivo. */
export function DecantCalculator({ fragrances }: { fragrances: FragranceSummary[] }) {
  const router = useRouter();
  const notify = useToast();
  const [i, setI] = usePersistentState<DecantCalcInput>('jf26_decant_calc_v2', DECANT_CALC_DEFAULTS);
  const [target, setTarget] = useState('');
  const [pending, start] = useTransition();
  const r = useMemo(() => calcDecants(i), [i]);
  const n = (k: keyof DecantCalcInput) => (e: React.ChangeEvent<HTMLInputElement>) => setI((p) => ({ ...p, [k]: parseFloat(e.target.value) || 0 }));
  const setSupply = (ml: 3 | 5 | 10, v: string) => setI((p) => ({ ...p, supplies: { ...p.supplies, [ml]: parseFloat(v) || 0 } }));

  const apply = () => {
    if (!target || !r) return notify('Elige una fragancia y calcula los precios primero');
    const lines = r.rows.filter((x) => !x.custom && x.sale > 0);
    const f = fragrances.find((x) => x.id === target);
    if (!f || !confirm(`Se actualizarán los precios de ${f.brand} ${f.name}:\n\n${lines.map((x) => `${x.ml} ml: ${money(x.sale)}`).join('\n')}\n\n¿Aplicar?`)) return;
    start(async () => {
      const res = await applyDecantPricesAction(target, Object.fromEntries(lines.map((x) => [`${x.ml}ml`, x.sale])));
      notify(res.ok ? 'Precios aplicados ✓' : res.error);
      router.refresh();
    });
  };

  return (
    <section className="space-y-4 rounded-3xl border border-cork bg-umber p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg">Costo de decants</h2>
        <Button size="sm" variant="link" onClick={() => confirm('¿Limpiar todos los datos de la calculadora?') && setI(DECANT_CALC_DEFAULTS)}>
          Limpiar
        </Button>
      </div>
      <Step title="1. Botella">
        <Field label="Perfume (opcional)" className="col-span-2">
          <Input value={i.name} placeholder="Ej. Pacific Chill" onChange={(e) => setI((p) => ({ ...p, name: e.target.value }))} />
        </Field>
        <Field label="Precio de la botella ($ MXN)">
          <Input type="number" min={0} value={i.bottlePrice || ''} onChange={n('bottlePrice')} />
        </Field>
        <Field label="Contenido (ml)">
          <Input type="number" min={0} value={i.bottleMl || ''} placeholder="100" onChange={n('bottleMl')} />
        </Field>
        <Field label="Gastos de la botella ($)" hint="Envío, cruce, impuestos">
          <Input type="number" min={0} value={i.bottleExtra || ''} onChange={n('bottleExtra')} />
        </Field>
        <Field label="Merma al decantar (ml)">
          <Input type="number" min={0} value={i.waste || ''} onChange={n('waste')} />
        </Field>
      </Step>

      <Step title="2. Insumos por decant (frasco, atomizador, etiqueta…)">
        {([3, 5, 10] as const).map((ml) => (
          <Field key={ml} label={`${ml} ml ($)`}>
            <Input type="number" min={0} value={i.supplies[ml] || ''} onChange={(e) => setSupply(ml, e.target.value)} />
          </Field>
        ))}
        <Field label="Otro tamaño (ml)">
          <Input type="number" min={0} value={i.customMl || ''} placeholder="Ej. 2" onChange={n('customMl')} />
        </Field>
        <Field label="Sus insumos ($)">
          <Input type="number" min={0} value={i.customSupplies || ''} onChange={n('customSupplies')} />
        </Field>
      </Step>

      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.1em] text-ember">3. Extras y ajustes</p>
        {i.extras.map((x, k) => (
          <div key={k} className="grid grid-cols-12 items-center gap-1.5">
            <Input className="col-span-5" placeholder="Concepto" value={x.name} onChange={(e) => setI((p) => ({ ...p, extras: p.extras.map((y, j) => (j === k ? { ...y, name: e.target.value } : y)) }))} />
            <Input className="col-span-3" type="number" min={0} placeholder="$ 0" value={x.amount || ''} onChange={(e) => setI((p) => ({ ...p, extras: p.extras.map((y, j) => (j === k ? { ...y, amount: parseFloat(e.target.value) || 0 } : y)) }))} />
            <Select className="col-span-3 px-1" value={x.scope} onChange={(e) => setI((p) => ({ ...p, extras: p.extras.map((y, j) => (j === k ? { ...y, scope: e.target.value as 'decant' | 'bottle' } : y)) }))}>
              <option value="decant">Por decant</option>
              <option value="bottle">A la botella</option>
            </Select>
            <button type="button" aria-label="Quitar" className="col-span-1 grid place-items-center text-bad" onClick={() => setI((p) => ({ ...p, extras: p.extras.filter((_, j) => j !== k) }))}>
              <X className="size-4" />
            </button>
          </div>
        ))}
        <Button size="sm" variant="ghost" onClick={() => setI((p) => ({ ...p, extras: [...p.extras, { name: '', amount: 0, scope: 'decant' }] }))}>
          <Plus className="size-3.5" /> Agregar extra
        </Button>
      </div>

      <Step title="4. Ganancia y redondeo">
        <Field label="Cómo calcular la ganancia" className="col-span-2">
          <Select value={i.profitMode} onChange={(e) => setI((p) => ({ ...p, profitMode: e.target.value as ProfitMode }))}>
            <option value="ml">$ por ml (equitativo entre tamaños)</option>
            <option value="pct">% sobre el costo</option>
            <option value="margin">% de margen sobre la venta</option>
            <option value="fixed">$ fijo por decant</option>
          </Select>
        </Field>
        <Field label={PROFIT_LABEL[i.profitMode]}>
          <Input type="number" min={0} value={i.profitValue || ''} onChange={n('profitValue')} />
        </Field>
        <Field label="Redondear precio">
          <Select value={i.round} onChange={(e) => setI((p) => ({ ...p, round: Number(e.target.value) }))}>
            <option value={0}>Sin redondeo</option>
            <option value={1}>Al peso</option>
            <option value={5}>A $5</option>
            <option value={10}>A $10</option>
          </Select>
        </Field>
      </Step>

      {!r ? (
        <p className="rounded-2xl border border-cork p-3 text-center text-sm text-sand">Escribe el precio y el contenido de la botella para ver los precios sugeridos.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {r.rows.map((x) => (
              <div key={`${x.ml}-${x.custom}`} className={cn('space-y-0.5 rounded-2xl border p-2.5 text-center', x.ml === 5 ? 'border-sand' : 'border-cork')}>
                <span className="block text-[10px] text-sand">
                  {x.ml} ml{x.custom ? ' (otro)' : ''}
                </span>
                <strong className="block text-lg font-medium">{money(x.sale)}</strong>
                <span className="block text-[10px] text-sand">Costo {money(x.cost)}</span>
                <span className={cn('block text-[10px]', x.profit >= 0 ? 'text-ok' : 'text-bad')}>
                  Ganas {money(x.profit)} ({x.margin.toFixed(0)}%)
                </span>
                <span className="block text-[10px] text-drift">{money(x.perMl)} por ml</span>
              </div>
            ))}
          </div>
          <div className="space-y-1 rounded-2xl border border-cork p-3 text-xs">
            <Line k="Inversión total (botella + gastos)" v={money(r.totalBottle)} />
            <Line k="ml vendibles" v={`${r.sellable} ml`} />
            <Line k="Costo del perfume por ml" v={money(r.costPerMl)} />
            {r.extraDecant > 0 && <Line k="Extras por decant" v={money(r.extraDecant)} />}
            <p className="pt-1 text-[11px] text-sand">Ganancia neta si vendes toda la botella en un solo tamaño (“recuperas con” = decants para cubrir la inversión):</p>
            {r.rows.map((x) => (
              <Line
                key={`n-${x.ml}`}
                k={`Todo en decants de ${x.ml} ml (${x.count} pzas)`}
                v={
                  <>
                    <b className={x.netAll >= 0 ? 'text-ok' : 'text-bad'}>{money(x.netAll)}</b>
                    <span className="text-sand"> neta{x.breakEven ? ` · recuperas con ${x.breakEven}` : ''}</span>
                  </>
                }
              />
            ))}
          </div>
          <div className="space-y-2 rounded-2xl border border-dashed border-cork p-3">
            <p className="text-[11px] text-sand">Aplicar precios de 3, 5 y 10 ml a una fragancia del catálogo</p>
            <div className="flex gap-2">
              <Select value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="">Elige una fragancia…</option>
                {fragrances.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.brand} – {f.name}
                  </option>
                ))}
              </Select>
              <Button variant="cream" onClick={apply} disabled={pending}>
                Aplicar
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-[0.1em] text-ember">{title}</p>
      <div className="grid grid-cols-2 gap-2">{children}</div>
    </div>
  );
}

function Line({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2 border-t border-dashed border-cork py-1 first:border-0">
      <span>{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}
