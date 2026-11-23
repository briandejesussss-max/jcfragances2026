'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { requestPasswordResetAction, updatePasswordAction, type FormState } from '@/controllers/account.controller';
import { Alert } from '@/views/shared/Alert';
import { Button } from '@/views/shared/Button';
import { Field, Input } from '@/views/shared/Field';
import { AuthShell } from './AuthShell';

export function ResetRequestForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordResetAction, {});
  return (
    <AuthShell
      eyebrow="Recuperar acceso"
      title="¿Olvidaste tu"
      accent="contraseña?"
      intro="Escribe tu correo y te enviamos un enlace para crear una nueva."
      footer={
        <Link href="/cuenta/ingresar" className="text-cream underline underline-offset-4">
          Volver a entrar
        </Link>
      }
    >
      <form action={action} className="space-y-3">
        <Field label="Correo">
          <Input name="email" type="email" autoComplete="email" required />
        </Field>
        {state.error && <Alert>{state.error}</Alert>}
        {state.message && <Alert tone="ok">{state.message}</Alert>}
        <Button type="submit" variant="cream" size="lg" className="w-full" disabled={pending}>
          Enviar enlace
        </Button>
      </form>
    </AuthShell>
  );
}

export function NewPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(updatePasswordAction, {});
  return (
    <AuthShell eyebrow="Mi cuenta" title="Nueva" accent="contraseña">
      <form action={action} className="space-y-3">
        <Field label="Nueva contraseña" hint="Mínimo 8 caracteres.">
          <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
        <Field label="Repite la contraseña">
          <Input name="confirm" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
        {state.error && <Alert>{state.error}</Alert>}
        <Button type="submit" variant="cream" size="lg" className="w-full" disabled={pending}>
          Guardar contraseña
        </Button>
      </form>
    </AuthShell>
  );
}
