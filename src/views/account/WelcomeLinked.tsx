import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { formatDate, formatMoney } from '@/lib/utils/format';
import type { Order } from '@/models/types';
import { buttonClass } from '@/views/shared/Button';
import { AddOrderForm } from './AddOrderForm';
import { OrderStatusBadge } from './OrderStatusBadge';

/** Bienvenida al crear la cuenta: pedidos ya ligados y formulario para agregar pedidos anteriores. */
export function WelcomeLinked({ name, email, orders, pendingOrder = '' }: { name: string; email: string; orders: Order[]; pendingOrder?: string }) {
  const first = name.split(' ')[0];
  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-12">
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.06em] text-ok">
        <CheckCircle2 className="size-5" /> Cuenta creada
      </p>
      <h1 className="text-[clamp(1.9rem,7vw,2.4rem)]">
        Bienvenida{first ? `, ${first}` : ''}. <span className="text-ember">Tu cuenta está lista</span>
      </h1>
      <p className="text-sm leading-relaxed text-sand">Desde ahora, lo que compres con tu sesión iniciada aparece en tu cuenta con su avance.</p>
      {orders.length > 0 && (
        <div className="space-y-2">
          {orders.slice(0, 5).map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-2 rounded-2xl border border-cork bg-umber p-3.5">
              <div>
                <strong className="block text-sm font-medium">{o.number}</strong>
                <span className="text-xs text-sand">
                  {formatDate(o.created_at)} · {formatMoney(o.total)}
                </span>
              </div>
              <OrderStatusBadge order={o} />
            </div>
          ))}
        </div>
      )}
      {!orders.some((o) => o.number === pendingOrder.toUpperCase()) && <AddOrderForm defaultEmail={email} defaultNumber={pendingOrder} />}
      <Link href="/cuenta" className={buttonClass('cream', 'lg', 'w-full')}>
        Ver mis pedidos
      </Link>
    </div>
  );
}
