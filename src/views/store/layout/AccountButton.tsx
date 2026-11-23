'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { UserRound } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';

/** Ícono de cuenta del encabezado: "Entrar" sin sesión, "Mi cuenta" con sesión. */
export function AccountButton() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const db = createSupabaseBrowserClient();
    db.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = db.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <Link
      href={signedIn ? '/cuenta' : '/cuenta/ingresar'}
      aria-label={signedIn ? 'Mi cuenta' : 'Entrar a mi cuenta'}
      className={cn('flex items-center gap-1.5 rounded-full p-2 text-[11px] uppercase tracking-[0.06em] hover:bg-bark', signedIn ? 'text-ember' : 'text-cream')}
    >
      <UserRound className="size-5" />
      <span className="hidden md:inline">{signedIn ? 'Mi cuenta' : 'Entrar'}</span>
    </Link>
  );
}
