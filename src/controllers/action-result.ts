import 'server-only';

import type { ActionResult } from '@/models/types';

/** Ejecuta la lógica de una acción y convierte cualquier error en un mensaje para la interfaz. */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Ocurrió un error inesperado';
    console.error('[action]', message);
    return { ok: false, error: message };
  }
}

export class UserError extends Error {}
