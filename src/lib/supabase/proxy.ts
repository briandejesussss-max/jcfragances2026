import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { supabaseEnv } from './env';

/**
 * Refresca la sesión de Supabase y protege /admin (propietario) y /cuenta (clientes).
 * Devuelve la respuesta con las cookies actualizadas.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = supabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // No pongas código entre createServerClient y getClaims(): refresca el token si está por vencer
  // y valida su firma en el servidor (llaves ES256), sin ir a Supabase en cada petición.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims?.sub ? data.claims : null;

  const { pathname } = request.nextUrl;
  const redirectTo = (path: string, next?: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = '';
    if (next) url.searchParams.set('next', next);
    const redirect = NextResponse.redirect(url);
    // Conserva las cookies de sesión que Supabase acaba de refrescar.
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

  // Panel del propietario (la verificación de administrador la hace el layout del panel).
  const isAdminLogin = pathname === '/admin/login';
  if (pathname.startsWith('/admin')) {
    if (!user && !isAdminLogin && pathname !== '/admin/no-autorizado') return redirectTo('/admin/login', pathname);
    if (user && isAdminLogin) return redirectTo('/admin');
  }

  // Cuenta de cliente
  const PUBLIC_ACCOUNT = ['/cuenta/registro', '/cuenta/ingresar', '/cuenta/recuperar', '/cuenta/revisa-tu-correo'];
  if (pathname.startsWith('/cuenta')) {
    const isPublic = PUBLIC_ACCOUNT.includes(pathname);
    if (!user && !isPublic) return redirectTo('/cuenta/ingresar', pathname);
    if (user && (pathname === '/cuenta/registro' || pathname === '/cuenta/ingresar')) return redirectTo('/cuenta');
  }

  return response;
}
