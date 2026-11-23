import { loadAdminStoreConfig } from '@/controllers/admin-data.controller';
import { FragranceForm } from '@/views/admin/fragrances/FragranceForm';
import { PageTitle } from '@/views/admin/shared/PageTitle';

export default async function NewFragrancePage() {
  const config = await loadAdminStoreConfig();
  return (
    <>
      <PageTitle title="Nueva fragancia" />
      <FragranceForm initial={null} config={config} />
    </>
  );
}
