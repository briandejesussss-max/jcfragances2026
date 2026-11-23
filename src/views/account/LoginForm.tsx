'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { magicLinkAction, passwordLoginAction, type FormState } from '@/controllers/account.controller';
import { cn } from '@/lib/utils/cn';
import { Alert } from '@/views/shared/Alert';
import { Button } from '@/views/shared/Button';
import { Field, Input } from '@/views/shared/Field';
import { AuthShell } from './AuthShell';
import { GoogleButton } from './GoogleButton';

type Mode = 'password' | 'link';

/** Entrar: Google, contraseña o enlace por correo (sin contraseña). */
export function LoginForm({
  next,
  initialMode = 'password',
  linkError = false,
  googleEnabled,
  signupEnabled,
  emailConfirmation,
  whatsappHelp,
}: {
  next: string;
  initialMode?: Mode;
  linkError?: boolean;
  googleEnabled: boolean;
  signupEnabled: boolean;
  /** Sin correos (sin dominio): solo contraseña y ayuda por WhatsApp */
  emailConfirmation: boolean;
  whatsappHelp: string;
}) {
  const [modeState, setMode] = useState<Mode>(initialMode);
  const mode: Mode = emailConfirmation ? modeState : 'password';
  const [pwState, pwAction, pwPending] = useActionState<FormState, FormData>(passwordLoginAction, {});
  const [lkState, lkAction, lkPending] = useActionState<FormState, FormData>(magicLinkAction, {});

  return (
    <AuthShell
      eyebrow="Entrar"
      title="Entra a"
      accent="mi cuenta"
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link href="/cuenta/registro" className="text-cream underline underline-offset-4">
            Crear cuenta
          </Link>
        </>
      }
    >
      {linkError && <Alert>El enlace ya expiró o no es válido. Pide uno nuevo.</Alert>}
      {googleEnabled && <GoogleButton next={next} />}

      {emailConfirmation && (
      <div className="flex gap-1.5 rounded-pill border border-cork p-1" role="tablist" aria-label="Forma de entrar">
        {(
          [
            ['password', 'Contraseña'],
            ['link', 'Enlace por correo'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={mode === k}
            onClick={() => setMode(k)}
            className={cn('h-10 flex-1 rounded-pill text-[11px] font-medium uppercase tracking-[0.05em]', mode === k ? 'bg-cream text-walnut' : 'text-sand')}
          >
            {label}
          </button>
        ))}
      </div>
      )}

      {mode === 'password' ? (
        <form action={pwAction} className="space-y-3">
          <input type="hidden" name="next" value={next} />
          <Field label="Correo">
            <Input name="email" type="email" autoComplete="email" required />
          </Field>
          <Field label="Contraseña">
            <Input name="password" type="password" autoComplete="current-password" required />
          </Field>
          {emailConfirmation ? (
            <Link href="/cuenta/recuperar" className="block text-right text-xs text-sand underline underline-offset-4">
              ¿Olvidaste tu contraseña?
            </Link>
          ) : (
            <a href={whatsappHelp} target="_blank" rel="noopener noreferrer" className="block text-right text-xs text-sand underline underline-offset-4">
              ¿Olvidaste tu contraseña? Escríbenos por WhatsApp
            </a>
          )}
          {pwState.error && <Alert>{pwState.error}</Alert>}
          <Button type="submit" variant="cream" size="lg" className="w-full" disabled={pwPending}>
            {pwPending ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      ) : (
        <form action={lkAction} className="space-y-3">
          <input type="hidden" name="next" value={next} />
          <Field label="Correo" hint={signupEnabled ? 'Te mandamos un botón para entrar sin contraseña.' : 'Te mandamos un botón para entrar sin contraseña (solo si ya tienes cuenta).'}>
            <Input name="email" type="email" autoComplete="email" required />
          </Field>
          {lkState.error && <Alert>{lkState.error}</Alert>}
          <Button type="submit" variant="cream" size="lg" className="w-full" disabled={lkPending}>
            {lkPending ? 'Enviando…' : 'Enviarme el enlace'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
