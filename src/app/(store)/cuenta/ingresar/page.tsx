import { getAuthSettings } from '@/lib/services/auth-settings';
import { LoginForm } from '@/views/account/LoginForm';

type Search = { next?: string; modo?: string; error?: string };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Search> }) {
  const [sp, settings] = await Promise.all([searchParams, getAuthSettings()]);
  const next = sp.next?.startsWith('/cuenta') ? sp.next : '/cuenta';
  return (
    <LoginForm
      next={next}
      initialMode={sp.modo === 'enlace' ? 'link' : 'password'}
      linkError={sp.error === 'enlace'}
      googleEnabled={settings.googleEnabled}
      signupEnabled={settings.signupEnabled}
    />
  );
}
