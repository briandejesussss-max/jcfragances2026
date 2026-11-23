'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveMovementAction } from '@/controllers/finance.controller';
import { todayInMexico } from '@/lib/utils/format';
import { MOVEMENT_CATEGORIES } from '@/models/domain/finance';
import type { Movement, MovementInput, MovementType } from '@/models/types';
import { Alert } from '@/views/shared/Alert';
import { Button } from '@/views/shared/Button';
import { Field, Input, Select } from '@/views/shared/Field';
import { Modal } from '@/views/shared/Modal';
import { useToast } from '@/views/shared/Toast';
import { financeHref } from './FinanceNav';

/** Alta y edición de ingresos y gastos. */
export function MovementForm({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: Movement | null }) {
  const router = useRouter();
  const notify = useToast();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [m, setM] = useState<MovementInput>(() =>
    editing
      ? { type: editing.type, date: editing.date, category: editing.category, amount: editing.amount, method: editing.method, note: editing.note }
      : { type: 'ingreso', date: todayInMexico(), category: '', amount: 0, method: '', note: '' },
  );
  const set = <K extends keyof MovementInput>(k: K, v: MovementInput[K]) => setM((prev) => ({ ...prev, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await saveMovementAction(editing?.id ?? null, m);
      if (!res.ok) return setError(res.error);
      notify('Guardado ✓');
      onClose();
      router.push(financeHref('mov', m.date.slice(0, 7)));
      router.refresh();
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar movimiento' : 'Nuevo movimiento'} size="sm">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Tipo">
          <Select value={m.type} onChange={(e) => set('type', e.target.value as MovementType)}>
            <option value="ingreso">Ingreso</option>
            <option value="gasto">Gasto</option>
          </Select>
        </Field>
        <Field label="Fecha">
          <Input type="date" value={m.date} onChange={(e) => set('date', e.target.value)} required />
        </Field>
        <Field label="Categoría">
          <Input list="movement-categories" value={m.category} onChange={(e) => set('category', e.target.value)} />
          <datalist id="movement-categories">
            {MOVEMENT_CATEGORIES[m.type].map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Monto (MXN)">
          <Input type="number" step="0.01" min="0.01" value={m.amount || ''} onChange={(e) => set('amount', parseFloat(e.target.value) || 0)} required />
        </Field>
        <Field label="Método de pago">
          <Input value={m.method} placeholder="Ej. Transferencia" onChange={(e) => set('method', e.target.value)} />
        </Field>
        <Field label="Nota (opcional)">
          <Input value={m.note} onChange={(e) => set('note', e.target.value)} />
        </Field>
        {error && <Alert>{error}</Alert>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="cream" disabled={pending}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
