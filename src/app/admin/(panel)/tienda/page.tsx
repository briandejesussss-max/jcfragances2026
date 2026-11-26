import { loadAdminCatalog } from '@/controllers/admin-data.controller';
import { HomeConfigForm } from '@/views/admin/store/HomeConfigForm';
import { StoreConfigForm } from '@/views/admin/store/StoreConfigForm';

export default async function StoreSettingsPage() {
  const { config, fragrances } = await loadAdminCatalog();
  return (
    <>
      <StoreConfigForm config={config} />
      <HomeConfigForm home={config.home} fragrances={fragrances} />
    </>
  );
}
