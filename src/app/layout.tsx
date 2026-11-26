import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { PALETTE_BOOT_SCRIPT } from '@/config/palettes';
import './globals.css';
import './aurora.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
/** Títulos de la estética "Degradado". */
const outfit = Outfit({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-display', display: 'swap' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jcfragances2026.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'JS FRAGANCES — Scent Vault & Sillage Studio', template: '%s | JS FRAGANCES' },
  description: 'Catálogo exclusivo de decants, curaduría de perfumes de autor y envíos a todo México.',
  openGraph: { type: 'website', locale: 'es_MX', siteName: 'JS FRAGANCES' },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: '#07060b',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: el script de abajo puede poner data-palette antes de hidratar
    <html lang="es-MX" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PALETTE_BOOT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
