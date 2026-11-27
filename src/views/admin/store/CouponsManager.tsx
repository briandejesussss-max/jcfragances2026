'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { deleteCouponAction, saveCouponAction } from '@/controllers/coupon.controller';
import { formatMoney } from '@/lib/utils/format';
import type { Coupon } from '@/models/types';
import { Alert } from '@/views/shared/Alert';
import { Button } from '@/views/shared/Button';
import { Checkbox, Field, Input, Select } from '@/views/shared/Field';
import { useToast } from '@/views/shared/Toast';

const EMPTY: Coupon = { code: '', kind: 'percent', value: 10, appliesTo: 'all', minSubtotal: 0, endsAt: null, maxUses: null, active: true };
const SCOPE = { all: 'toda la compra', decants: 'decants', bottles: 'botellas' } as const;

const describe = (c: Coupon) =>
  `${c.kind === 'percent' ? `${c.value}%` : formatMoney(c.value)} en ${SCOPE[c.appliesTo]}` +
  (c.minSubtotal > 0 ? ` · desde ${formatMoney(c.minSubtotal)}` : '') +
  (c.endsAt ? ` · hasta el ${c.endsAt.split('-').reverse().join('/')}` : '');

/** Panel → Tienda: códigos de descuento que el cliente escribe en su bolsa. */
export function CouponsManager({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const notify = useToast();
  const [editing, setEditing] = useState<{ c: Coupon; prev?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = () =>
    editing &&
    start(async () => {
      setError(null);
      const res = await saveCouponAction(editing.c, editing.prev);
      if (!res.ok) return setError(res.error);
      notify('Código guardado ✓');
      setEditing(null);
      router.refresh();
    });

  const remove = (code: string) =>
    start(async () => {
      if (!confirm(`¿Borrar el código ${code}? Los pedidos que ya lo usaron no cambian.`)) return;
      const res = await deleteCouponAction(code);
      if (!res.ok) return notify(res.error);
      notify('Código borrado');
      router.refresh();
    });

  const toggle = (c: Coupon) =>
    start(async () => {
      const res = await saveCouponAction({ ...c, active: !c.active });
      if (!res.ok) return notify(res.error);
      router.refresh();
    });

  const set = <K extends keyof Coupon>(k: K, v: Coupon[K]) => setEditing((e) => (e ? { ...e, c: { ...e.c, [k]: v } } : e));

  return (
    <section className="mt-5 space-y-3 rounded-3xl border border-cork bg-umber p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Tag className="size-4 text-ember" /> Códigos de descuento
          </h3>
          <p className="text-[11px] text-drift">El cliente lo escribe en su bolsa; el descuento se calcula y se guarda en el pedido.</p>
        </div>
        {!editing && (
          <Button variant="cream" size="sm" onClick={() => setEditing({ c: { ...EMPTY } })}>
            <Plus className="size-3.5" /> Nuevo código
          </Button>
        )}
      </div>

      {editing && (
        <div className="space-y-3 rounded-2xl border border-ember/40 bg-walnut/40 p-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Código" hint="3 a 20 letras o números. Ej.: JS10">
              <Input value={editing.c.code} maxLength={20} autoCapitalize="characters" onChange={(e) => set('code', e.target.value.toUpperCase().replace(/\s+/g, ''))} className="font-mono uppercase" />
            </Field>
            <Field label="Tipo de descuento">
              <Select value={editing.c.kind} onChange={(e) => set('kind', e.target.value as Coupon['kind'])}>
                <option value="percent">Porcentaje (%)</option>
                <option value="amount">Cantidad fija ($)</option>
              </Select>
            </Field>
            <Field label={editing.c.kind === 'percent' ? 'Porcentaje' : 'Cantidad (MXN)'}>
              <Input type="number" inputMode="decimal" min={1} max={editing.c.kind === 'percent' ? 100 : undefined} value={editing.c.value || ''} onChange={(e) => set('value', Number(e.target.value))} />
            </Field>
            <Field label="Aplica en">
              <Select value={editing.c.appliesTo} onChange={(e) => set('appliesTo', e.target.value as Coupon['appliesTo'])}>
                <option value="all">Toda la compra</option>
                <option value="decants">Solo decants</option>
                <option value="bottles">Solo botellas</option>
              </Select>
            </Field>
            <Field label="Compra mínima (opcional)" hint="0 = sin mínimo">
              <Input type="number" inputMode="numeric" min={0} value={editing.c.minSubtotal || ''} placeholder="0" onChange={(e) => set('minSubtotal', Number(e.target.value) || 0)} />
            </Field>
            <Field label="Usos máximos (opcional)" hint="Vacío = ilimitado">
              <Input type="number" inputMode="numeric" min={1} value={editing.c.maxUses ?? ''} onChange={(e) => set('maxUses', Number(e.target.value) > 0 ? Number(e.target.value) : null)} />
            </Field>
            <Field label="Válido hasta (opcional)" hint="Último día que funciona">
              <Input type="date" value={editing.c.endsAt ?? ''} onChange={(e) => set('endsAt', e.target.value || null)} />
            </Field>
          </div>
          <Checkbox label="Activo" checked={editing.c.active} onChange={(e) => set('active', e.target.checked)} />
          {error && <Alert>{error}</Alert>}
          <div className="flex flex-wrap gap-2">
            <Button variant="cream" size="sm" onClick={save} disabled={pending}>
              {pending ? 'Guardando…' : 'Guardar código'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => (setEditing(null), setError(null))}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {coupons.length === 0 && !editing && <p className="text-sm text-sand">Aún no tienes códigos. Crea uno con «Nuevo código».</p>}
      <ul className="space-y-2">
        {coupons.map((c) => {
          const expired = !!c.endsAt && c.endsAt < new Date().toISOString().slice(0, 10);
          const soldOut = c.maxUses !== null && (c.uses ?? 0) >= c.maxUses;
          return (
            <li key={c.code} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cork bg-walnut/40 p-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <strong className="font-mono text-base">{c.code}</strong>
                  <span className={`rounded-pill px-2 py-0.5 text-[11px] ${c.active && !expired && !soldOut ? 'bg-ok/15 text-ok' : 'bg-bark text-drift'}`}>
                    {!c.active ? 'Pausado' : expired ? 'Vencido' : soldOut ? 'Agotado' : 'Activo'}
                  </span>
                </p>
                <p className="text-xs text-sand">{describe(c)}</p>
                <p className="text-[11px] text-drift">
                  Usado {c.uses ?? 0} {c.uses === 1 ? 'vez' : 'veces'}
                  {c.maxUses ? ` de ${c.maxUses}` : ''}
                </p>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="ghost" onClick={() => toggle(c)} disabled={pending}>
                  {c.active ? 'Pausar' : 'Activar'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => (setError(null), setEditing({ c: { ...c }, prev: c.code }))} aria-label={`Editar ${c.code}`}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button size="sm" variant="danger" onClick={() => remove(c.code)} disabled={pending} aria-label={`Borrar ${c.code}`}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
