import { loadAdminStoreConfig } from '@/controllers/admin-data.controller';
import { StoreConfigForm } from '@/views/admin/store/StoreConfigForm';

export default async function StoreSettingsPage() {
  const config = await loadAdminStoreConfig();
  return <StoreConfigForm config={config} />;
}
