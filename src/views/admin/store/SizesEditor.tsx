'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { SizeConfig, SizeKind } from '@/models/types';
import { Button } from '@/views/shared/Button';
import { Input, Label, Select } from '@/views/shared/Field';

/** Presentaciones que vende la tienda (decant, miniatura o botella parcial). */
export function SizesEditor({ value, onChange }: { value: SizeConfig[]; onChange: (s: SizeConfig[]) => void }) {
  const update = (i: number, patch: Partial<SizeConfig>) => onChange(value.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  return (
    <div className="space-y-2">
      <Label>Presentaciones</Label>
      {value.map((s, i) => (
        <div key={s.key} className="grid grid-cols-12 items-center gap-1.5">
          <Input className="col-span-5" value={s.label} placeholder="Nombre (ej. Miniatura 5 ml)" onChange={(e) => update(i, { label: e.target.value })} />
          <Input className="col-span-2" type="number" min={0.5} step={0.5} value={s.ml || ''} placeholder="ml" onChange={(e) => update(i, { ml: parseFloat(e.target.value) || 0 })} />
          <Select className="col-span-4" value={s.kind} onChange={(e) => update(i, { kind: e.target.value as SizeKind })}>
            <option value="decant">Decant</option>
            <option value="pieza">Miniatura</option>
            <option value="parcial">Botella parcial</option>
          </Select>
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="col-span-1 grid place-items-center text-bad" aria-label="Quitar presentación">
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      <Button size="sm" variant="ghost" onClick={() => onChange([...value, { key: `s${Date.now().toString(36)}`, label: '', ml: 0, kind: 'decant' }])}>
        <Plus className="size-3.5" /> Agregar presentación
      </Button>
      <p className="text-[11px] text-drift">Los decants descuentan ml del inventario; las miniaturas y botellas parciales se cuentan por pieza.</p>
    </div>
  );
}
