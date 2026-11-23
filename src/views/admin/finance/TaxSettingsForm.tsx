'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveTaxSettingsAction } from '@/controllers/finance.controller';
import type { AppSettings, TaxBase } from '@/models/types';
import { Button } from '@/views/shared/Button';
import { Field, Input, Select } from '@/views/shared/Field';
import { useToast } from '@/views/shared/Toast';

/** Porcentaje a apartar para impuestos (no calcula impuestos oficiales). */
export function TaxSettingsForm({ settings }: { settings: AppSettings }) {
  const router = useRouter();
  const notify = useToast();
  const [pending, start] = useTransition();
  const [pct, setPct] = useState(String(settings.taxReservePct));
  const [base, setBase] = useState<TaxBase>(settings.taxBase);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await saveTaxSettingsAction({ taxReservePct: parseFloat(pct), taxBase: base });
      notify(res.ok ? 'Guardado ✓' : res.error);
      if (res.ok) router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="max-w-md space-y-3 rounded-3xl border border-cork bg-umber p-5">
      <h2 className="text-lg">Impuestos</h2>
      <Field label="Porcentaje a reservar (%)">
        <Input type="number" min={0} max={100} step="0.01" value={pct} onChange={(e) => setPct(e.target.value)} />
      </Field>
      <Field label="Calcular sobre">
        <Select value={base} onChange={(e) => setBase(e.target.value as TaxBase)}>
          <option value="beneficio">Beneficio del mes</option>
          <option value="ingresos">Ingresos del mes</option>
        </Select>
      </Field>
      <p className="text-[11px] text-sand">
        Confirma el porcentaje y la base con tu contador según tu régimen. Esta app no calcula impuestos oficiales: solo te ayuda a apartar dinero.
      </p>
      <Button type="submit" variant="cream" disabled={pending}>
        Guardar
      </Button>
    </form>
  );
}
