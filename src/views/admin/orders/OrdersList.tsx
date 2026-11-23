'use client';

import { useMemo, useState } from 'react';
import { ORDER_STATUS_LABEL } from '@/config/store';
import type { Order, OrderStatus } from '@/models/types';
import { Select } from '@/views/shared/Field';
import { PageTitle } from '../shared/PageTitle';
import { OrderCard } from './OrderCard';

export function OrdersList({ orders, accounts }: { orders: Order[]; accounts: Record<string, { notifyEmail: boolean }> }) {
  const [status, setStatus] = useState<OrderStatus | 'activos' | 'todos'>('activos');
  const list = useMemo(
    () =>
      orders.filter((o) =>
        status === 'todos' ? true : status === 'activos' ? !['entregado', 'cancelado'].includes(o.status) : o.status === status,
      ),
    [orders, status],
  );

  return (
    <>
      <PageTitle title="Pedidos">
        <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="w-auto">
          <option value="activos">En curso</option>
          <option value="todos">Todos</option>
          {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </PageTitle>
      {list.length === 0 ? (
        <p className="rounded-3xl border border-cork bg-umber p-6 text-center text-sm text-sand">{orders.length ? 'No hay pedidos con ese filtro.' : 'Aún no hay pedidos.'}</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((o) => (
            <OrderCard key={o.id} order={o} account={o.user_id ? accounts[o.user_id] : undefined} />
          ))}
        </div>
      )}
    </>
  );
}
