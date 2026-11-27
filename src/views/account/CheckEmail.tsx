'use client';

import { useActionState } from 'react';
import { Mail, ShieldCheck } from 'lucide-react';
import { resendConfirmationAction, type FormState } from '@/controllers/account.controller';
import { Alert } from '@/views/shared/Alert';
import { Button } from '@/views/shared/Button';

export function CheckEmail({ email, isMagicLink }: { email: string; isMagicLink: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resendConfirmationAction, {});
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 px-4 py-14 text-center">
      <div className="grid size-22 place-items-center rounded-full border border-dashed border-cork text-ember">
        <Mail className="size-10" strokeWidth={1.5} />
      </div>
      <h1 className="text-3xl">Revisa tu correo</h1>
      <p className="text-sm leading-relaxed text-sand">
        Te enviamos un enlace{email && <> a <span className="text-cream">{email}</span></>}. {isMagicLink ? 'Ábrelo para entrar a tu cuenta.' : 'Ábrelo para confirmar tu cuenta.'}
      </p>
      {!isMagicLink && (
        <div className="w-full space-y-2 rounded-2xl border border-cork bg-bark/60 p-4 text-left">
          <span className="text-[11px] uppercase tracking-[0.1em] text-ember">¿Por qué confirmar?</span>
          <p className="flex gap-2.5 text-sm leading-relaxed text-sand">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-cream" />
            Así sabemos que el correo es tuyo y podemos mostrarte los pedidos que ya hiciste con él.
          </p>
        </div>
      )}
      {!isMagicLink && email && (
        <form action={action} className="w-full space-y-2">
          <input type="hidden" name="email" value={email} />
          <Button type="submit" variant="ghost" size="lg" className="w-full" disabled={pending}>
            Reenviar correo
          </Button>
          {state.error && <Alert>{state.error}</Alert>}
          {state.message && <Alert tone="ok">{state.message}</Alert>}
        </form>
      )}
      <span className="text-xs text-sand">Revisa también tu carpeta de spam.</span>
    </div>
  );
}
