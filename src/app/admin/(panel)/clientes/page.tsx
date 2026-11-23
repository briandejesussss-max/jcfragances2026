import { loadCustomers } from '@/controllers/admin-data.controller';
import { CustomersList } from '@/views/admin/customers/CustomersList';

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const customers = await loadCustomers(q);
  return <CustomersList customers={customers} query={q} />;
}
