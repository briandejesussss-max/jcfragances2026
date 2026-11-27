'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Check, Tag, X } from 'lucide-react';
import { quoteCouponAction } from '@/controllers/coupon.controller';
import type { CartLine, CouponQuote } from '@/models/types';

/**
 * "¿Tienes un código?": lo revisa la base de datos y se vuelve a revisar cada vez que
 * cambia la bolsa (el descuento depende de lo que lleve).
 */
export function CouponField({
  cart,
  code,
  setCode,
  quote,
  setQuote,
}: {
  cart: CartLine[];
  code: string;
  setCode: (c: string) => void;
  quote: CouponQuote | null;
  setQuote: (q: CouponQuote | null) => void;
}) {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const cartKey = JSON.stringify(cart.map((l) => [l.fragId, l.size, l.qty]));
  const last = useRef('');

  const check = (c: string) =>
    start(async () => {
      const res = await quoteCouponAction(c, cart);
      setQuote(res.ok ? res.data : { ok: false, message: res.error });
    });

  // Con un código aplicado, se recalcula cuando cambia la bolsa
  useEffect(() => {
    if (!code || !cart.length) return;
    const k = `${code}|${cartKey}`;
    if (last.current === k) return;
    last.current = k;
    check(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo cuando cambian el código o la bolsa
  }, [code, cartKey]);

  if (code)
    return (
      <div className={`flex items-center justify-between gap-2 rounded-2xl border p-2.5 text-sm ${quote?.ok ? 'border-ok/40 bg-ok/10' : 'border-bad/40 bg-bad/10'}`} role="status">
        <span className="flex min-w-0 items-center gap-2">
          {quote?.ok ? <Check className="size-4 shrink-0 text-ok" /> : <Tag className="size-4 shrink-0 text-bad" />}
          <span className="min-w-0">
            <strong className="font-mono">{code}</strong>
            <span className="block text-xs text-sand">{pending ? 'Revisando…' : quote?.message}</span>
          </span>
        </span>
        <button
          type="button"
          onClick={() => {
            setCode('');
            setQuote(null);
            last.current = '';
          }}
          aria-label="Quitar código"
          className="grid size-8 shrink-0 place-items-center rounded-full text-sand hover:bg-bark"
        >
          <X className="size-4" />
        </button>
      </div>
    );

  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-sm text-ember">
        <Tag className="size-4" /> ¿Tienes un código de descuento?
      </button>
    );

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const c = draft.trim().toUpperCase().replace(/\s+/g, '');
        if (!c) return;
        last.current = `${c}|${cartKey}`;
        setCode(c);
        check(c);
      }}
    >
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Escribe tu código"
        aria-label="Código de descuento"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        maxLength={20}
        className="min-w-0 flex-1 rounded-pill border border-cork bg-walnut px-4 py-2 font-mono uppercase text-cream placeholder:normal-case placeholder:font-sans placeholder:text-drift"
      />
      <button type="submit" disabled={pending || !draft.trim()} className="btn-primary shrink-0 rounded-pill bg-bark px-4 py-2 text-xs font-semibold uppercase tracking-[0.04em] text-cream disabled:opacity-40">
        Aplicar
      </button>
    </form>
  );
}
