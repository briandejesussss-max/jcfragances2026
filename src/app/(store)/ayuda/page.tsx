import type { Metadata } from 'next';
import { getCatalog } from '@/controllers/catalog.controller';
import { HelpGuide } from '@/views/store/help/HelpGuide';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Guía para clientes',
  description: 'Cómo comprar decants y botellas, qué significa cada presentación, cómo crear tu cuenta y seguir tus pedidos.',
  alternates: { canonical: '/ayuda' },
};

export default async function HelpPage() {
  const { config } = await getCatalog();
  return <HelpGuide config={config} />;
}
