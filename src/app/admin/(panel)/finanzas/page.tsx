import { loadFinance } from '@/controllers/admin-data.controller';
import { todayInMexico } from '@/lib/utils/format';
import { isMonth } from '@/models/domain/finance';
import { FinanceDashboard } from '@/views/admin/finance/FinanceDashboard';
import { FinanceTabs, MonthNav, type FinanceTab } from '@/views/admin/finance/FinanceNav';
import { MovementsTable } from '@/views/admin/finance/MovementsTable';
import { TaxSettingsForm } from '@/views/admin/finance/TaxSettingsForm';
import { PageTitle } from '@/views/admin/shared/PageTitle';

type Search = { tab?: string; mes?: string; tipo?: string };

export default async function FinancePage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const tab: FinanceTab = sp.tab === 'mov' || sp.tab === 'cfg' ? sp.tab : 'dash';
  const month = isMonth(sp.mes) ? sp.mes : todayInMexico().slice(0, 7);
  const type = sp.tipo === 'ingreso' || sp.tipo === 'gasto' ? sp.tipo : 'todos';
  const { movements, orders, settings } = await loadFinance();

  return (
    <>
      <PageTitle title="Finanzas">
        <FinanceTabs tab={tab} month={month} />
      </PageTitle>
      {tab !== 'cfg' && <MonthNav tab={tab} month={month} type={tab === 'mov' && type !== 'todos' ? type : undefined} />}
      {tab === 'dash' && <FinanceDashboard month={month} movements={movements} orders={orders} settings={settings} />}
      {tab === 'mov' && <MovementsTable month={month} type={type} movements={movements} />}
      {tab === 'cfg' && <TaxSettingsForm settings={settings} />}
    </>
  );
}
