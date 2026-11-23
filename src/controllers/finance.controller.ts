'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAction } from '@/lib/auth/session';
import {
  deleteMovement,
  insertMovement,
  saveAppSettings,
  updateMovement,
} from '@/models/repositories/finance.repository';
import type { ActionResult, AppSettings, MovementInput } from '@/models/types';
import { runAction, UserError } from './action-result';

const FINANCE_PATH = '/admin/finanzas';

export async function saveMovementAction(id: string | null, input: MovementInput): Promise<ActionResult> {
  return runAction(async () => {
    const db = await requireAdminAction();
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new UserError('El monto debe ser mayor a 0');
    if (input.type !== 'ingreso' && input.type !== 'gasto') throw new UserError('Tipo de movimiento no válido');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new UserError('Fecha no válida');
    const row: MovementInput = {
      type: input.type,
      date: input.date,
      amount,
      category: String(input.category ?? '').trim(),
      method: String(input.method ?? '').trim(),
      note: String(input.note ?? '').trim(),
    };
    if (id) await updateMovement(db, id, row);
    else await insertMovement(db, row);
    revalidatePath(FINANCE_PATH, 'layout');
    return undefined;
  });
}

export async function deleteMovementAction(id: string): Promise<ActionResult> {
  return runAction(async () => {
    const db = await requireAdminAction();
    await deleteMovement(db, id);
    revalidatePath(FINANCE_PATH, 'layout');
    return undefined;
  });
}

export async function saveTaxSettingsAction(settings: AppSettings): Promise<ActionResult> {
  return runAction(async () => {
    const db = await requireAdminAction();
    const pct = Number(settings.taxReservePct);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) throw new UserError('Escribe un porcentaje entre 0 y 100');
    await saveAppSettings(db, { taxReservePct: pct, taxBase: settings.taxBase === 'ingresos' ? 'ingresos' : 'beneficio' });
    revalidatePath(FINANCE_PATH, 'layout');
    return undefined;
  });
}
