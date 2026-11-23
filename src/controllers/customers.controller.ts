'use server';

import { randomInt } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { requireAdminAction } from '@/lib/auth/session';
import { setCustomerPassword } from '@/models/repositories/customer.repository';
import type { ActionResult } from '@/models/types';
import { runAction, UserError } from './action-result';

// Sin letras que se confundan al dictarlas (0/O, 1/l/I).
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

/** Contraseña temporal fácil de dictar por WhatsApp: JS-xxxx-xxxx (aleatoria y segura). */
function temporaryPassword(): string {
  const chunk = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
  return `JS-${chunk()}-${chunk()}`;
}

/**
 * Pone una contraseña temporal a un cliente que olvidó la suya y cierra sus sesiones abiertas.
 * Devuelve la contraseña UNA vez para que el propietario se la mande; no se guarda en ningún lado.
 */
export async function resetCustomerPasswordAction(userId: string): Promise<ActionResult<{ password: string }>> {
  return runAction(async () => {
    const db = await requireAdminAction();
    if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new UserError('Cliente no válido');
    const password = temporaryPassword();
    await setCustomerPassword(db, userId, password);
    revalidatePath('/admin/clientes');
    return { password };
  });
}
