'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { deleteMovementAction } from '@/controllers/finance.controller';
import { centsToMoney, inMonth, totals, cents } from '@/models/domain/finance';
import type { Movement } from '@/models/types';
import { Button } from '@/views/shared/Button';
import { Select } from '@/views/shared/Field';
import { useToast } from '@/views/shared/Toast';
import { financeHref } from './FinanceNav';
import { MovementForm } from './MovementForm';

export function MovementsTable({ month, type, movements }: { month: string; type: string; movements: Movement[] }) {
  const router = useRouter();
  const notify = useToast();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<{ open: boolean; editing: Movement | null; key: number }>({ open: false, editing: null, key: 0 });

  let rows = inMonth(movements, month);
  if (type !== 'todos') rows = rows.filter((r) => r.type === type);
  const k = totals(rows, 0, 'ingresos');

  const open = (editing: Movement | null) => setForm((f) => ({ open: true, editing, key: f.key + 1 }));
  const remove = (id: string) => {
    if (!confirm('¿Eliminar este movimiento? No se puede deshacer.')) return;
    start(async () => {
      const res = await deleteMovementAction(id);
      notify(res.ok ? 'Eliminado' : res.error);
      router.refresh();
    });
  };

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Select className="w-auto" value={type} onChange={(e) => router.push(financeHref('mov', month, e.target.value))}>
          <option value="todos">Todos</option>
          <option value="ingreso">Ingresos</option>
          <option value="gasto">Gastos</option>
        </Select>
        <Button variant="cream" onClick={() => open(null)}>
          <Plus className="size-4" /> Nuevo movimiento
        </Button>
      </div>
      <div className="overflow-x-auto rounded-3xl border border-cork bg-umber">
        {rows.length ? (
          <table className="w-full text-left text-xs">
            <thead className="text-sand">
              <tr className="border-b border-dashed border-cork">
                <th className="p-3 font-normal">Fecha</th>
                <th className="p-3 font-normal">Tipo</th>
                <th className="p-3 font-normal">Categoría</th>
                <th className="p-3 font-normal">Nota</th>
                <th className="p-3 text-right font-normal">Monto</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-dashed border-cork last:border-0">
                  <td className="whitespace-nowrap p-3">{r.date}</td>
                  <td className={`p-3 ${r.type === 'ingreso' ? 'text-ok' : 'text-bad'}`}>{r.type === 'ingreso' ? 'Ingreso' : 'Gasto'}</td>
                  <td className="p-3">{r.category}</td>
                  <td className="p-3 text-sand">{r.note}</td>
                  <td className="whitespace-nowrap p-3 text-right">{centsToMoney(cents(r.amount))}</td>
                  <td className="whitespace-nowrap p-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => open(r)}>
                      Editar
                    </Button>{' '}
                    <Button size="sm" variant="danger" onClick={() => remove(r.id)} disabled={pending}>
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-6 text-center text-sm text-sand">Aún no hay movimientos en este mes.</p>
        )}
      </div>
      {rows.length > 0 && (
        <p className="mt-3 text-right text-xs">
          Ingresos {centsToMoney(k.income)} · Gastos {centsToMoney(k.expenses)} · <b className="font-medium">Balance {centsToMoney(k.balance)}</b>
        </p>
      )}
      <MovementForm key={form.key} open={form.open} editing={form.editing} onClose={() => setForm((f) => ({ ...f, open: false }))} />
    </>
  );
}
