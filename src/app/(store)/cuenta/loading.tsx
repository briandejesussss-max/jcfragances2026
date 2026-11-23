import { PageSkeleton } from '@/views/shared/PageSkeleton';

export default function AccountLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <PageSkeleton cards={2} label="Cargando tu cuenta…" />
    </div>
  );
}
