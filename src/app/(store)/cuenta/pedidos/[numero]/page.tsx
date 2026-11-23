import { notFound } from 'next/navigation';
import { loadMyOrder } from '@/controllers/account-data.controller';
import { getCatalog } from '@/controllers/catalog.controller';
import { OrderDetail } from '@/views/account/OrderDetail';

export default async function MyOrderPage({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params;
  const [order, { config }] = await Promise.all([loadMyOrder(decodeURIComponent(numero)), getCatalog()]);
  if (!order) notFound();
  return <OrderDetail order={order} config={config} />;
}
