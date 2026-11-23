import { cn } from '@/lib/utils/cn';
import { hasOnDemand, statusLabel } from '@/models/domain/orders';
import type { Order } from '@/models/types';

export function OrderStatusBadge({ order }: { order: Order }) {
  const tone = order.status === 'entregado' ? 'border-ok text-ok' : order.status === 'cancelado' ? 'border-bad text-bad' : 'border-ember text-ember';
  return (
    <span className={cn('inline-block rounded-pill border px-2.5 py-1 text-[10px] uppercase tracking-[0.05em]', tone)}>
      {hasOnDemand(order.items) && !['entregado', 'cancelado'].includes(order.status) ? 'Bajo pedido · ' : ''}
      {statusLabel(order.status)}
    </span>
  );
}
