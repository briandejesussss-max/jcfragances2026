import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { formatDate, formatMoney } from '@/lib/utils/format';
import type { Order } from '@/models/types';
import { buttonClass } from '@/views/shared/Button';
import { OrderStatusBadge } from './OrderStatusBadge';

/** Bienvenida al confirmar la cuenta: muestra los pedidos anteriores que se ligaron por correo. */
export function WelcomeLinked({ name, email, linked, orders }: { name: string; email: string; linked: number; orders: Order[] }) {
  const first = name.split(' ')[0];
  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-12">
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.06em] text-ok">
        <CheckCircle2 className="size-5" /> Correo confirmado
      </p>
      <h1 className="text-[clamp(1.9rem,7vw,2.4rem)]">
        Bienvenida{first ? `, ${first}` : ''}.{' '}
        {orders.length > 0 && (
          <span className="text-ember">
            {linked > 0 ? `Encontramos ${linked} ${linked === 1 ? 'pedido tuyo' : 'pedidos tuyos'}` : 'Estos son tus pedidos'}
          </span>
        )}
      </h1>
      <p className="text-sm leading-relaxed text-sand">
        {linked > 0
          ? `Los compraste antes con ${email}, así que ya los agregamos a tu cuenta.`
          : 'Desde ahora, tus compras con sesión iniciada aparecen aquí con su avance.'}
      </p>
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
      <div className="rounded-2xl border border-dashed border-cork p-3.5 text-xs leading-relaxed text-sand">
        ¿Falta algún pedido? Si lo hiciste con otro correo, escríbenos por WhatsApp y lo agregamos.
      </div>
      <Link href="/cuenta" className={buttonClass('cream', 'lg', 'w-full')}>
        Ver mis pedidos
      </Link>
    </div>
  );
}
