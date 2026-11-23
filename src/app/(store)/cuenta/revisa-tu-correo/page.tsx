import { CheckEmail } from '@/views/account/CheckEmail';

export default async function CheckEmailPage({ searchParams }: { searchParams: Promise<{ email?: string; tipo?: string }> }) {
  const sp = await searchParams;
  return <CheckEmail email={sp.email ?? ''} isMagicLink={sp.tipo === 'enlace'} />;
}
