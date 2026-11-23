import type { Metadata } from 'next';
import { requireAdminPage } from '@/lib/auth/session';
import { AdminShell } from '@/views/admin/layout/AdminShell';

export const metadata: Metadata = { title: 'Panel', robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdminPage();
  return <AdminShell email={user.email ?? ''}>{children}</AdminShell>;
}
