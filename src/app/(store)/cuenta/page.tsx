import { loadMyOrders } from '@/controllers/account-data.controller';
import { MyOrders } from '@/views/account/MyOrders';

export default async function MyAccountPage({ searchParams }: { searchParams: Promise<{ contrasena?: string }> }) {
  const [{ orders, profile }, sp] = await Promise.all([loadMyOrders(), searchParams]);
  return <MyOrders name={profile?.name ?? ''} orders={orders} passwordChanged={sp.contrasena === 'ok'} />;
}
