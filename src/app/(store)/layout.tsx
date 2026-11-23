import { getCatalog } from '@/controllers/catalog.controller';
import { StoreShell } from '@/views/store/layout/StoreShell';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const data = await getCatalog();
  return <StoreShell data={data}>{children}</StoreShell>;
}
