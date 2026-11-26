import { loadAdminStats } from '@/controllers/admin-data.controller';
import { StatsDashboard } from '@/views/admin/stats/StatsDashboard';

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const { dias } = await searchParams;
  const stats = await loadAdminStats(Number(dias) || 30);
  return <StatsDashboard stats={stats} />;
}
