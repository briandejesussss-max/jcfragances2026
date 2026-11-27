'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { todayInMexico } from '@/lib/utils/format';
import { useStore } from '../state/StoreProvider';

/** Días que faltan (hora de México); null si no hay fecha. */
function daysLeft(endsAt?: string): number | null {
  if (!endsAt) return null;
  const today = new Date(`${todayInMexico()}T00:00:00Z`).getTime();
  const end = new Date(`${endsAt}T00:00:00Z`).getTime();
  return Math.round((end - today) / 86_400_000);
}

/** Barra de promoción arriba de la tienda (se configura en Panel → Tienda). */
export function PromoBar() {
  const { config } = useStore();
  const promo = config.promo;
  // La cuenta regresiva depende de la fecha de hoy: se calcula ya en el navegador
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la fecha de hoy solo existe en el navegador
    setDays(daysLeft(promo?.endsAt));
  }, [promo?.endsAt]);

  if (!promo?.text) return null;
  if (days !== null && days < 0) return null;
  const extra = days === null ? '' : days === 0 ? ' · Último día' : ` · Quedan ${days} ${days === 1 ? 'día' : 'días'}`;
  const body = (
    <>
      <span className="min-w-0">
        {promo.text}
        <span className="font-semibold">{extra}</span>
      </span>
      {promo.link && <ArrowRight className="size-3.5 shrink-0" aria-hidden="true" />}
    </>
  );
  const cls = 'promo-bar flex items-center justify-center gap-1.5 px-4 py-2 text-center text-xs font-medium';
  if (!promo.link) return <div className={cls}>{body}</div>;
  return promo.link.startsWith('/') ? (
    <Link href={promo.link} className={cls}>
      {body}
    </Link>
  ) : (
    <a href={promo.link} target="_blank" rel="noopener noreferrer" className={cls}>
      {body}
    </a>
  );
}
