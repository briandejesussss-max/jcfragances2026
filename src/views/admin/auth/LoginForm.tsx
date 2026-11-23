'use client';

import { useActionState } from 'react';
import { login, type LoginState } from '@/controllers/auth.controller';
import { Alert } from '@/views/shared/Alert';
import { Button } from '@/views/shared/Button';
import { Field, Input } from '@/views/shared/Field';

/** Acceso del propietario con Supabase Auth. */
export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="mx-auto mt-[12vh] w-[min(22rem,calc(100%-2rem))] space-y-3 rounded-3xl border border-cork bg-umber p-6">
      <h1 className="text-xl">Panel privado</h1>
      <p className="text-xs text-sand">Solo para el propietario de la tienda.</p>
      <input type="hidden" name="next" value={next} />
      <Field label="Correo">
        <Input name="email" type="email" autoComplete="username" required />
      </Field>
      <Field label="Contraseña">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      {state.error && <Alert>{state.error}</Alert>}
      <Button type="submit" variant="cream" className="w-full" disabled={pending}>
        {pending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
}
