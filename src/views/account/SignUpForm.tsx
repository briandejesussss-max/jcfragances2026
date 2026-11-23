'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signUpAction, type FormState } from '@/controllers/account.controller';
import { Alert } from '@/views/shared/Alert';
import { Button } from '@/views/shared/Button';
import { Field, Input } from '@/views/shared/Field';
import { AuthShell, Divider } from './AuthShell';
import { GoogleButton } from './GoogleButton';

export function SignUpForm({ email = '', signupEnabled, googleEnabled }: { email?: string; signupEnabled: boolean; googleEnabled: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signUpAction, {});
  return (
    <AuthShell
      eyebrow="Crear cuenta"
      title="Sigue tus pedidos"
      accent="desde tu perfil"
      intro="Crea tu cuenta para ver en qué etapa va cada pedido. Es opcional: puedes seguir comprando sin registrarte."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link href="/cuenta/ingresar" className="text-cream underline underline-offset-4">
            Entrar
          </Link>
        </>
      }
    >
      {!signupEnabled && <Alert>El registro de cuentas aún no está activo. Mientras tanto puedes rastrear tu pedido con su número y tu correo.</Alert>}
      {googleEnabled && (
        <>
          <GoogleButton />
          <Divider>o con tu correo</Divider>
        </>
      )}
      <form action={action} className="space-y-3">
        <Field label="Nombre">
          <Input name="name" autoComplete="name" required />
        </Field>
        <Field label="Correo">
          <Input name="email" type="email" autoComplete="email" defaultValue={email} required />
        </Field>
        <Field label="Contraseña" hint="Mínimo 8 caracteres. Bloqueamos contraseñas filtradas en internet.">
          <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
        <label className="flex items-start gap-2.5 text-xs leading-relaxed text-sand">
          <input type="checkbox" name="notify" defaultChecked className="mt-0.5 size-4 accent-ember" />
          Avisarme por correo cuando mi pedido cambie de etapa
        </label>
        {state.error && <Alert>{state.error}</Alert>}
        <Button type="submit" variant="cream" size="lg" className="w-full" disabled={pending || !signupEnabled}>
          {pending ? 'Creando cuenta…' : 'Crear mi cuenta'}
        </Button>
      </form>
      <Link href="/cuenta/ingresar?modo=enlace" className="self-center text-xs text-sand underline underline-offset-4">
        Prefiero que me manden un enlace sin contraseña
      </Link>
    </AuthShell>
  );
}
