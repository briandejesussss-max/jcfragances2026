import { PageSkeleton } from '@/views/shared/PageSkeleton';

export default function PanelLoading() {
  return <PageSkeleton cards={4} label="Cargando sección del panel…" />;
}
