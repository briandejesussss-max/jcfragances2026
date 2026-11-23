import { getAuthSettings } from '@/lib/services/auth-settings';
import { SignUpForm } from '@/views/account/SignUpForm';

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ email?: string; pedido?: string }> }) {
  const [{ email, pedido }, settings] = await Promise.all([searchParams, getAuthSettings()]);
  return (
    <SignUpForm
      email={email ?? ''}
      order={pedido ?? ''}
      signupEnabled={settings.signupEnabled}
      googleEnabled={settings.googleEnabled}
      emailConfirmation={settings.emailConfirmation}
      emailNotifications={settings.emailNotifications}
    />
  );
}
