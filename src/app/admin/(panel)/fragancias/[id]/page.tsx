import { notFound } from 'next/navigation';
import { loadAdminFragrance } from '@/controllers/admin-data.controller';
import { FragranceForm } from '@/views/admin/fragrances/FragranceForm';
import { PageTitle } from '@/views/admin/shared/PageTitle';

export default async function EditFragrancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { config, fragrance } = await loadAdminFragrance(decodeURIComponent(id));
  if (!fragrance) notFound();
  return (
    <>
      <PageTitle title={`Editar: ${fragrance.brand} ${fragrance.name}`} />
      <FragranceForm initial={fragrance} config={config} />
    </>
  );
}
