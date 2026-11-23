import type { Metadata } from 'next';
import { LoginForm } from '@/views/admin/auth/LoginForm';

export const metadata: Metadata = { title: 'Panel privado', robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <LoginForm next={next?.startsWith('/admin') ? next : '/admin'} />;
}
