import { loadAdminCatalog } from '@/controllers/admin-data.controller';
import { InventoryPanel } from '@/views/admin/inventory/InventoryPanel';

export default async function InventoryPage() {
  const { fragrances, config } = await loadAdminCatalog();
  return <InventoryPanel fragrances={fragrances} config={config} />;
}
