import { loadCustomers } from '@/controllers/admin-data.controller';
import { CustomersList } from '@/views/admin/customers/CustomersList';

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; vista?: string }> }) {
  const { q = '', vista } = await searchParams;
  const { customers, guests } = await loadCustomers(q);
  return <CustomersList customers={customers} guests={guests} query={q} view={vista === 'sin-cuenta' ? 'guests' : 'accounts'} />;
}
