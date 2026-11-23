import { loadAdminCatalog } from '@/controllers/admin-data.controller';
import { FragranceList } from '@/views/admin/fragrances/FragranceList';

export default async function FragrancesPage() {
  const { fragrances, config } = await loadAdminCatalog();
  return <FragranceList fragrances={fragrances} config={config} />;
}
