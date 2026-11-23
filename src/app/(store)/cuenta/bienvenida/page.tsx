import { loadWelcome } from '@/controllers/account-data.controller';
import { WelcomeLinked } from '@/views/account/WelcomeLinked';

export default async function WelcomePage() {
  const { linked, orders, profile, email } = await loadWelcome();
  return <WelcomeLinked name={profile?.name ?? ''} email={email} linked={linked} orders={orders} />;
}
