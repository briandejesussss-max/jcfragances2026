import { loadMyProfile } from '@/controllers/account-data.controller';
import { ProfileForm } from '@/views/account/ProfileForm';

export default async function ProfilePage() {
  const { profile, email, providers } = await loadMyProfile();
  return <ProfileForm profile={profile} email={email} providers={providers} />;
}
