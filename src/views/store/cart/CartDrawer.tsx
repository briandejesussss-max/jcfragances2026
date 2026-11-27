'use client';

import { useEffect, useState } from 'react';
import { Minus, Plus, Trash2, X } from 'lucide-react';
import { SHIPPING } from '@/config/store';
import type { PlacedOrder } from '@/controllers/checkout.controller';
import { BOTTLE, presentationLabel, sizeState, stockIssues } from '@/models/domain/sizes';
import type { Fragrance } from '@/models/types';
import { Alert } from '@/views/shared/Alert';
import { Button } from '@/views/shared/Button';
import { useStore } from '../state/StoreProvider';
import { CheckoutForm } from './CheckoutForm';
import { PaymentModal } from './PaymentModal';

/** Bolsa de pedido: renglones, existencias, total estimado y formulario de entrega. */
export function CartDrawer() {
  const { cartOpen, setCartOpen, cart, byId, sizes, price, changeQty, removeLine, clearCart } = useStore();
  const [checkout, setCheckout] = useState(false);
  const [placed, setPlaced] = useState<(PlacedOrder & { email: string }) | null>(null);

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setCartOpen(false);
    window.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [cartOpen, setCartOpen]);

  const rows = cart.map((l) => {
    const f = byId.get(l.fragId);
    const unit = f ? sizeState(f as Fragrance, l.size, sizes).price : 0;
    return { line: l, f, unit };
  });
  const count = cart.reduce((a, l) => a + l.qty, 0);
  const subtotal = rows.reduce((a, r) => a + r.unit * r.line.qty, 0);
  const issues = stockIssues(cart, byId as Map<string, Fragrance>, sizes);

  const onPlaced = (o: PlacedOrder, email: string) => {
    clearCart();
    setCheckout(false);
    setCartOpen(false);
    setPlaced({ ...o, email });
  };

  return (
    <>
      {cartOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Bolsa de pedido">
          <button type="button" aria-label="Cerrar bolsa" className="absolute inset-0 bg-black/60" onClick={() => setCartOpen(false)} />
          <aside className="animate-slide-in absolute inset-y-0 right-0 flex w-[min(26rem,100vw)] flex-col border-l border-dashed border-cork bg-walnut">
            <div className="flex items-center justify-between border-b border-dashed border-cork p-4">
              <h2 className="text-base">Tu bolsa ({count})</h2>
              <button type="button" onClick={() => setCartOpen(false)} aria-label="Cerrar" className="rounded-full p-1.5 text-sand hover:bg-bark">
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {rows.length === 0 && (
                <div className="py-10 text-center text-sand">
                  <p className="text-2xl text-cream">✦</p>
                  <p className="mt-1 text-sm">Tu bolsa de pedido está vacía</p>
                </div>
              )}
              {rows.map(({ line, f, unit }, i) => (
                <div key={`${line.fragId}-${line.size}`} className="flex items-center justify-between gap-2 rounded-2xl border border-cork bg-umber p-3">
                  <div className="min-w-0">
                    <span className="block text-[11px] uppercase tracking-[0.1em] text-sand">{f?.brand ?? 'No disponible'}</span>
                    <span className="block truncate text-sm">{f?.name ?? 'Fragancia retirada'}</span>
                    <span className="text-[11px] text-sand">
                      {f ? presentationLabel(sizes, f as Fragrance, line.size, true) : line.size}
                      {f && line.size !== BOTTLE && (f.prices?.[line.size] as { mode?: string } | undefined)?.mode === 'pedido' && ' · Bajo pedido'}
                      {' · '}
                      {price(unit * line.qty)}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <QtyButton label="Quitar uno" onClick={() => changeQty(i, -1)}>
                      <Minus className="size-3.5" />
                    </QtyButton>
                    <span className="w-6 text-center text-sm">{line.qty}</span>
                    <QtyButton label="Agregar uno" onClick={() => changeQty(i, 1)}>
                      <Plus className="size-3.5" />
                    </QtyButton>
                    <QtyButton label="Eliminar" onClick={() => removeLine(i)}>
                      <Trash2 className="size-3.5 text-bad" />
                    </QtyButton>
                  </div>
                </div>
              ))}

              {issues.length > 0 && (
                <Alert>
                  <b>⚠️ Existencias:</b>
                  {issues.map((m) => (
                    <div key={m}>• {m}</div>
                  ))}
                </Alert>
              )}

              {checkout && rows.length > 0 && (
                <div className="pt-3">
                  <CheckoutForm onPlaced={onPlaced} disabled={issues.length > 0} />
                </div>
              )}
            </div>

            {rows.length > 0 && (
              <div className="space-y-2 border-t border-dashed border-cork p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-sand">Productos</span>
                  <span>{price(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-sand">
                  <span>Envío general</span>
                  <span>{price(SHIPPING.base)}</span>
                </div>
                <div className="flex justify-between text-base font-medium">
                  <span>Total estimado</span>
                  <span>{price(subtotal + SHIPPING.base)}</span>
                </div>
                {!checkout && (
                  <Button variant="cream" size="lg" className="w-full" onClick={() => setCheckout(true)} disabled={issues.length > 0}>
                    Continuar con mi pedido
                  </Button>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
      <PaymentModal order={placed} onClose={() => setPlaced(null)} />
    </>
  );
}

function QtyButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="grid size-7 place-items-center rounded-full border border-cork hover:bg-bark">
      {children}
    </button>
  );
}
