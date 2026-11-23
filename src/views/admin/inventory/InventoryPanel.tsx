'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { adjustInventoryAction, saveLowThresholdAction, type InventoryInput } from '@/controllers/inventory.controller';
import { formatMl } from '@/lib/utils/format';
import { GENDER_OPTIONS } from '@/models/domain/catalog';
import { hasBottleStock, hasMlStock, sizesOf, sizeLabel } from '@/models/domain/sizes';
import type { FragranceSummary, StoreConfig } from '@/models/types';
import { Button } from '@/views/shared/Button';
import { Field, Input, Select } from '@/views/shared/Field';
import { useToast } from '@/views/shared/Toast';
import { PageTitle } from '../shared/PageTitle';

const NEW = '__new__';

/** Existencias: ml para decants y piezas de botella. */
export function InventoryPanel({ fragrances, config }: { fragrances: FragranceSummary[]; config: StoreConfig }) {
  const router = useRouter();
  const notify = useToast();
  const sizes = sizesOf(config);
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState(fragrances[0]?.id ?? NEW);
  const [kind, setKind] = useState<InventoryInput['kind']>('ml');
  const [mode, setMode] = useState<InventoryInput['mode']>('add');
  const [qty, setQty] = useState('');
  const [filter, setFilter] = useState('');
  const [low, setLow] = useState(String(config.lowMlThreshold));
  const [draft, setDraft] = useState({ name: '', brand: '', concentration: '', gender: 'Unisex', prices: { '3ml': '', '5ml': '', '10ml': '', bottle: '' } as Record<string, string> });

  const current = fragrances.find((f) => f.id === selected);
  const list = useMemo(() => {
    const q = filter.toLowerCase().trim();
    return fragrances.filter((f) => `${f.brand} ${f.name}`.toLowerCase().includes(q));
  }, [fragrances, filter]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await adjustInventoryAction({
        fragranceId: selected,
        kind,
        mode,
        qty: parseFloat(qty),
        newFragrance:
          selected === NEW
            ? { ...draft, prices: Object.fromEntries(Object.entries(draft.prices).map(([k, v]) => [k, parseFloat(v) || 0])) }
            : undefined,
      });
      if (!res.ok) {
        notify(res.error, 4000);
        return;
      }
      notify('Inventario actualizado');
      setQty('');
      if (selected === NEW) setSelected(res.data.id);
      router.refresh();
    });
  };

  const saveLow = () =>
    start(async () => {
      const res = await saveLowThresholdAction(parseFloat(low) || 0);
      notify(res.ok ? 'Límite guardado ✓' : res.error);
      router.refresh();
    });

  return (
    <>
      <PageTitle title="Inventario" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <form onSubmit={submit} className="space-y-3 self-start rounded-3xl border border-cork bg-umber p-4 sm:p-5">
          <Field label="Fragancia">
            <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
              {fragrances.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.brand} – {f.name}
                </option>
              ))}
              <option value={NEW}>➕ Nueva fragancia…</option>
            </Select>
          </Field>

          {selected === NEW && (
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-dashed border-cork p-3">
              <Input placeholder="Nombre" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              <Input placeholder="Marca" value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} />
              <Input placeholder="Concentración" value={draft.concentration} onChange={(e) => setDraft({ ...draft, concentration: e.target.value })} />
              <Select value={draft.gender} onChange={(e) => setDraft({ ...draft, gender: e.target.value })}>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </Select>
              {Object.keys(draft.prices).map((k) => (
                <Input
                  key={k}
                  type="number"
                  min={0}
                  placeholder={`${k === 'bottle' ? 'Botella' : sizeLabel(sizes, k)} $`}
                  value={draft.prices[k]}
                  onChange={(e) => setDraft({ ...draft, prices: { ...draft.prices, [k]: e.target.value } })}
                />
              ))}
            </div>
          )}

          <div className="flex gap-4 text-xs">
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="kind" checked={kind === 'ml'} onChange={() => setKind('ml')} className="accent-ember" /> 💧 ml para decants
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="kind" checked={kind === 'bottles'} onChange={() => setKind('bottles')} className="accent-ember" /> 🍾 Botellas
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={mode} onChange={(e) => setMode(e.target.value as InventoryInput['mode'])}>
              <option value="add">Sumar</option>
              <option value="set">Fijar exacto</option>
            </Select>
            <Input type="number" min={0} step={kind === 'ml' ? 0.5 : 1} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Cantidad" required />
          </div>
          {current && (
            <p className="text-[11px] text-sand">
              Actual: 🍾 {hasBottleStock(current) ? current.stock?.bottles : 'sin control'} · 💧 {hasMlStock(current) ? `${formatMl(current.stock?.ml ?? 0)} ml` : 'sin control'}
            </p>
          )}
          <Button type="submit" variant="cream" className="w-full" disabled={pending}>
            Guardar inventario
          </Button>

          <div className="flex items-end gap-2 border-t border-dashed border-cork pt-3">
            <Field label="Aviso de pocos ml (ml)" className="flex-1">
              <Input type="number" min={0} value={low} onChange={(e) => setLow(e.target.value)} />
            </Field>
            <Button variant="ghost" onClick={saveLow} disabled={pending}>
              Guardar
            </Button>
          </div>
        </form>

        <div className="space-y-2">
          <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar en inventario…" />
          <div className="divide-y divide-dashed divide-cork rounded-3xl border border-cork bg-umber">
            {list.map((f) => {
              const ml = f.stock?.ml ?? 0;
              return (
                <div key={f.id} className="flex items-center justify-between gap-2 p-3 text-xs">
                  <div className="min-w-0">
                    <span className="block text-[9px] uppercase tracking-[0.08em] text-sand">{f.brand}</span>
                    <span className="block truncate">{f.name}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 font-mono text-[11px]">
                    <span>🍾 {hasBottleStock(f) ? f.stock?.bottles : '—'}</span>
                    <span>💧 {hasMlStock(f) ? `${formatMl(ml)} ml` : '—'}</span>
                    {hasMlStock(f) && ml <= 0 && <span className="rounded bg-bad/20 px-1.5 text-bad">Agotado</span>}
                    {hasMlStock(f) && ml > 0 && ml <= config.lowMlThreshold && <span className="rounded bg-ember/20 px-1.5 text-ember">Pocos ml</span>}
                    <Button size="sm" variant="ghost" onClick={() => setSelected(f.id)}>
                      Ajustar
                    </Button>
                  </div>
                </div>
              );
            })}
            {list.length === 0 && <p className="p-4 text-center text-sand">Sin resultados</p>}
          </div>
        </div>
      </div>
    </>
  );
}
