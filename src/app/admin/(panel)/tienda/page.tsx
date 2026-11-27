import { loadAdminCatalog, loadAdminCoupons } from '@/controllers/admin-data.controller';
import { CouponsManager } from '@/views/admin/store/CouponsManager';
import { HomeConfigForm } from '@/views/admin/store/HomeConfigForm';
import { StoreConfigForm } from '@/views/admin/store/StoreConfigForm';

export default async function StoreSettingsPage() {
  const [{ config, fragrances }, coupons] = await Promise.all([loadAdminCatalog(), loadAdminCoupons()]);
  return (
    <>
      <StoreConfigForm config={config} />
      <CouponsManager coupons={coupons} />
      <HomeConfigForm home={config.home} fragrances={fragrances} />
    </>
  );
}
