import type { NextConfig } from 'next';

const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname;
  } catch {
    return '';
  }
})();

const nextConfig: NextConfig = {
  images: {
    // Fotos de frascos (Supabase Storage) y de notas olfativas (Unsplash).
    remotePatterns: [
      ...(supabaseHost
        ? [{ protocol: 'https' as const, hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }]
        : []),
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
  experimental: {
    // Las fotos se suben directo a Storage desde el navegador; las acciones solo reciben URLs y JSON.
    serverActions: { bodySizeLimit: '2mb' },
  },
  async redirects() {
    return [
      // Rutas del sitio anterior
      // Enlaces compartidos antes: /?perfume=casa-nombre
      { source: '/', has: [{ type: 'query', key: 'perfume', value: '(?<slug>.+)' }], destination: '/perfume/:slug', permanent: true },
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/index-app.html', destination: '/', permanent: true },
      { source: '/admin.html', destination: '/admin/finanzas', permanent: true },
    ];
  },
};

export default nextConfig;
