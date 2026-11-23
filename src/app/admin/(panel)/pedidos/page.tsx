import { loadAdminOrders } from '@/controllers/admin-data.controller';
import { OrdersList } from '@/views/admin/orders/OrdersList';

export default async function OrdersPage() {
  const { orders, accounts } = await loadAdminOrders();
  return <OrdersList orders={orders} accounts={accounts} />;
}
