'use client';

import { useActionState } from 'react';
import { googleLoginAction, type FormState } from '@/controllers/account.controller';
import { Alert } from '@/views/shared/Alert';
import { Button } from '@/views/shared/Button';

/** "Continuar con Google": redirige a Google y regresa a /auth/callback. */
export function GoogleButton({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(googleLoginAction, {});
  return (
    <form action={action} className="space-y-2">
      {next && <input type="hidden" name="next" value={next} />}
      <Button type="submit" variant="ghost" size="lg" className="w-full" disabled={pending}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 12h6a6 6 0 1 1-1.8-4.3" />
        </svg>
        {pending ? 'Abriendo Google…' : 'Continuar con Google'}
      </Button>
      {state.error && <Alert>{state.error}</Alert>}
    </form>
  );
}
