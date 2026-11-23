import { loadMyProfile } from '@/controllers/account-data.controller';
import { getAuthSettings } from '@/lib/services/auth-settings';
import { ProfileForm } from '@/views/account/ProfileForm';

export default async function ProfilePage() {
  const [{ profile, email, providers }, settings] = await Promise.all([loadMyProfile(), getAuthSettings()]);
  return <ProfileForm profile={profile} email={email} providers={providers} emailNotifications={settings.emailNotifications} emailConfirmed={settings.emailConfirmation} />;
}
