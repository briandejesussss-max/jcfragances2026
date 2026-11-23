'use client';

import { useActionState, useEffect, useRef } from 'react';
import { claimOrderAction, type FormState } from '@/controllers/account.controller';
import { Alert } from '@/views/shared/Alert';
import { Button } from '@/views/shared/Button';
import { Field, Input } from '@/views/shared/Field';

/** Agrega a la cuenta un pedido hecho sin sesión (número + correo con el que se compró). */
export function AddOrderForm({ defaultEmail = '', defaultNumber = '', compact = false }: { defaultEmail?: string; defaultNumber?: string; compact?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(claimOrderAction, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.message) form.current?.reset();
  }, [state]);

  return (
    <form ref={form} action={action} className="space-y-3 rounded-3xl border border-dashed border-cork p-4">
      <div>
        <p className="text-sm font-medium uppercase">¿Compraste antes sin cuenta?</p>
        {!compact && <p className="mt-1 text-xs leading-relaxed text-sand">Agrega tu pedido con su número y el correo con el que compraste para verlo aquí.</p>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Número de pedido">
          <Input name="number" placeholder="JS-1012" autoComplete="off" defaultValue={defaultNumber} required />
        </Field>
        <Field label="Correo de la compra">
          <Input name="email" type="email" defaultValue={defaultEmail} required />
        </Field>
      </div>
      {state.error && <Alert>{state.error}</Alert>}
      {state.message && <Alert tone="ok">{state.message}</Alert>}
      <Button type="submit" variant="ghost" className="w-full" disabled={pending}>
        {pending ? 'Buscando…' : 'Agregar pedido'}
      </Button>
    </form>
  );
}
