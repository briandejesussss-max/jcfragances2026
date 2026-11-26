import Link from 'next/link';
import { customerLogoutAction } from '@/controllers/account.controller';
import { formatDate, formatMoney } from '@/lib/utils/format';
import type { Order } from '@/models/types';
import { buttonClass } from '@/views/shared/Button';
import { Alert } from '@/views/shared/Alert';
import { lastNote } from './order-progress';
import { AddOrderForm } from './AddOrderForm';
import { OrderProgress } from './OrderProgress';
import { OrderStatusBadge } from './OrderStatusBadge';

const isActive = (o: Order) => !['entregado', 'cancelado'].includes(o.status);

/** "Mi cuenta": pedidos del cliente con su avance. */
export function MyOrders({ name, email, orders, passwordChanged, pendingReviews = 0 }: { name: string; email: string; orders: Order[]; passwordChanged?: boolean; pendingReviews?: number }) {
  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-10">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-sand">Hola{name ? `, ${name.split(' ')[0]}` : ''}</p>
          <h1 className="mt-2 text-3xl">Mis pedidos</h1>
        </div>
        <Link href="/cuenta/perfil" className="text-xs text-sand underline underline-offset-4">
          Mis datos
        </Link>
      </div>
      {passwordChanged && <Alert tone="ok">Contraseña actualizada ✓</Alert>}
      {pendingReviews > 0 && (
        <div className="rounded-2xl border border-ember/50 bg-ember/10 px-4 py-3 text-sm">
          ⭐ Tienes {pendingReviews} {pendingReviews === 1 ? 'perfume' : 'perfumes'} por calificar. Abre un pedido entregado y cuéntanos qué te pareció.
        </div>
      )}

      {orders.length === 0 ? (
        <div className="space-y-3 rounded-3xl border border-dashed border-cork p-6 text-center text-sm text-sand">
          <p>Aún no tienes pedidos en tu cuenta.</p>
          <Link href="/#catalogo" className={buttonClass('ghost', 'md')}>
            Ver catálogo
          </Link>
        </div>
      ) : (
        orders.map((o) => {
          const note = lastNote(o);
          return (
            <article key={o.id} className="space-y-3 rounded-3xl border border-cork bg-umber p-4">
              <div className="flex items-baseline justify-between gap-2">
                <strong className="text-base font-medium">{o.number}</strong>
                <span className="text-xs text-sand">
                  {formatDate(o.created_at)} · {formatMoney(o.total)}
                </span>
              </div>
              <OrderStatusBadge order={o} />
              {isActive(o) && <OrderProgress order={o} />}
              {isActive(o) && note && (
                <p className="text-xs leading-relaxed text-sand">
                  Última nota · {formatDate(note.at)}: “{note.note}”
                </p>
              )}
              <Link href={`/cuenta/pedidos/${encodeURIComponent(o.number)}`} className={buttonClass(isActive(o) ? 'ghost' : 'link', 'md', isActive(o) ? 'w-full' : '')}>
                Ver detalle
              </Link>
            </article>
          );
        })
      )}

      <AddOrderForm defaultEmail={email} compact={orders.length > 0} />

      <form action={customerLogoutAction} className="pt-4 text-center">
        <button type="submit" className="text-xs text-sand underline underline-offset-4">
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
