import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Solo el panel, la cuenta y el retorno de inicio de sesión usan la sesión;
  // la tienda pública queda fuera del proxy y se sirve desde caché.
  matcher: ['/admin/:path*', '/cuenta/:path*', '/auth/:path*'],
};
