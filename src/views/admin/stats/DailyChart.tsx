'use client';

import { useState } from 'react';
import type { AdminStats } from '@/models/types';

const dayFmt = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const label = (d: string) => dayFmt.format(new Date(`${d}T00:00:00Z`));

/** Barras de visitantes por día; al pasar el dedo o el mouse muestra el día, visitantes y pedidos. */
export function DailyChart({ daily }: { daily: AdminStats['daily'] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...daily.map((d) => d.visitors));
  const sel = active === null ? null : daily[active];
  const total = daily.reduce((a, d) => a + d.visitors, 0);

  return (
    <div>
      <p className="mb-2 h-4 text-xs text-sand" aria-live="polite">
        {sel ? (
          <>
            <strong className="text-cream">{label(sel.day)}</strong> · {sel.visitors} {sel.visitors === 1 ? 'visitante' : 'visitantes'} · {sel.orders} {sel.orders === 1 ? 'pedido' : 'pedidos'}
          </>
        ) : (
          `${total.toLocaleString('es-MX')} visitas en total · toca una barra para ver el día`
        )}
      </p>
      <div className="flex h-36 items-end gap-[2px] border-b border-cork" onMouseLeave={() => setActive(null)}>
        {daily.map((d, i) => (
          <button
            key={d.day}
            type="button"
            aria-label={`${label(d.day)}: ${d.visitors} visitantes, ${d.orders} pedidos`}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            className="group flex h-full min-w-0 flex-1 items-end"
          >
            <span
              className={`block w-full rounded-t-[4px] transition-colors ${active === i ? 'bg-cream' : 'bg-ember group-hover:bg-cream'}`}
              style={{ height: `${Math.max(d.visitors ? 3 : 0, (d.visitors / max) * 100)}%` }}
            />
          </button>
        ))}
      </div>
      {daily.length > 0 && (
        <div className="mt-1 flex justify-between text-[10px] text-drift">
          <span>{label(daily[0].day)}</span>
          <span>{label(daily[daily.length - 1].day)}</span>
        </div>
      )}
    </div>
  );
}
