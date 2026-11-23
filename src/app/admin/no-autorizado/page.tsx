import type { Metadata } from 'next';
import { NotAuthorized } from '@/views/admin/auth/NotAuthorized';

export const metadata: Metadata = { title: 'No autorizado', robots: { index: false, follow: false } };

export default function NotAuthorizedPage() {
  return <NotAuthorized />;
}
