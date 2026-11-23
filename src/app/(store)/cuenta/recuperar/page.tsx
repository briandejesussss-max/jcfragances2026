import { getCatalog } from '@/controllers/catalog.controller';
import { getAuthSettings } from '@/lib/services/auth-settings';
import { whatsappLink } from '@/lib/utils/whatsapp';
import { AuthShell } from '@/views/account/AuthShell';
import { ResetRequestForm } from '@/views/account/PasswordForms';
import { buttonClass } from '@/views/shared/Button';

export default async function ResetPage() {
  const [settings, { config }] = await Promise.all([getAuthSettings(), getCatalog()]);
  if (settings.emailConfirmation) return <ResetRequestForm />;
  return (
    <AuthShell eyebrow="Recuperar acceso" title="¿Olvidaste tu" accent="contraseña?" intro="Escríbenos por WhatsApp desde el número de tu pedido y te ayudamos a recuperar tu cuenta.">
      <a href={whatsappLink(config.whatsapp, 'Hola, olvidé la contraseña de mi cuenta en la tienda. ¿Me ayudas?')} target="_blank" rel="noopener noreferrer" className={buttonClass('whatsapp', 'lg', 'w-full')}>
        Escribir por WhatsApp
      </a>
    </AuthShell>
  );
}
