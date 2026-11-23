import { getCatalog } from '@/controllers/catalog.controller';
import { getAuthSettings } from '@/lib/services/auth-settings';
import { whatsappLink } from '@/lib/utils/whatsapp';
import { LoginForm } from '@/views/account/LoginForm';

type Search = { next?: string; modo?: string; error?: string };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Search> }) {
  const [sp, settings, { config }] = await Promise.all([searchParams, getAuthSettings(), getCatalog()]);
  const next = sp.next?.startsWith('/cuenta') ? sp.next : '/cuenta';
  return (
    <LoginForm
      next={next}
      initialMode={sp.modo === 'enlace' ? 'link' : 'password'}
      linkError={sp.error === 'enlace'}
      googleEnabled={settings.googleEnabled}
      signupEnabled={settings.signupEnabled}
      emailConfirmation={settings.emailConfirmation}
      whatsappHelp={whatsappLink(config.whatsapp, 'Hola, olvidé la contraseña de mi cuenta en la tienda. ¿Me ayudas?')}
    />
  );
}
