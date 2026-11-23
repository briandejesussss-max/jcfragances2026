import { loadAdminCatalog } from '@/controllers/admin-data.controller';
import { getUsdRate } from '@/lib/services/exchange-rate';
import { DecantCalculator } from '@/views/admin/calculators/DecantCalculator';
import { PriceCalculator } from '@/views/admin/calculators/PriceCalculator';
import { PageTitle } from '@/views/admin/shared/PageTitle';

export default async function CalculatorsPage() {
  const [{ fragrances }, usdRate] = await Promise.all([loadAdminCatalog(), getUsdRate()]);
  return (
    <>
      <PageTitle title="Calculadoras" />
      <div className="grid gap-5 lg:grid-cols-2">
        <PriceCalculator usdRate={usdRate} />
        <DecantCalculator fragrances={fragrances} />
      </div>
    </>
  );
}
