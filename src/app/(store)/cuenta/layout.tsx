import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Mi cuenta', robots: { index: false, follow: false } };

// Páginas con sesión: siempre se generan al momento.
export const dynamic = 'force-dynamic';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
