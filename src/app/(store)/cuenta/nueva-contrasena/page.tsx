import { requireCustomerPage } from '@/lib/auth/session';
import { NewPasswordForm } from '@/views/account/PasswordForms';

export default async function NewPasswordPage() {
  await requireCustomerPage('/cuenta/nueva-contrasena');
  return <NewPasswordForm />;
}
