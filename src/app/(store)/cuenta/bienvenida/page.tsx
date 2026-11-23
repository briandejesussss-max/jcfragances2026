import { loadWelcome } from '@/controllers/account-data.controller';
import { WelcomeLinked } from '@/views/account/WelcomeLinked';

export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ pedido?: string }> }) {
  const [{ orders, profile, email }, sp] = await Promise.all([loadWelcome(), searchParams]);
  const pending = /^[A-Za-z]{1,4}-\d{1,8}$/.test(sp.pedido ?? '') ? sp.pedido! : '';
  return <WelcomeLinked name={profile?.name ?? ''} email={email} orders={orders} pendingOrder={pending} />;
}
