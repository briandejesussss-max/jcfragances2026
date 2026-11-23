import { getAuthSettings } from '@/lib/services/auth-settings';
import { SignUpForm } from '@/views/account/SignUpForm';

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const [{ email }, settings] = await Promise.all([searchParams, getAuthSettings()]);
  return <SignUpForm email={email ?? ''} signupEnabled={settings.signupEnabled} googleEnabled={settings.googleEnabled} />;
}
