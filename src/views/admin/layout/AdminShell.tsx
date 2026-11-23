import Link from 'next/link';
import { ExternalLink, LogOut } from 'lucide-react';
import { logout } from '@/controllers/auth.controller';
import { ToastProvider } from '@/views/shared/Toast';
import { AdminNav } from './AdminNav';

/** Marco del panel: encabezado, navegación por secciones y cierre de sesión. */
export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  return (
    <ToastProvider>
      <header className="sticky top-0 z-30 border-b border-dashed border-cork bg-walnut/90 backdrop-blur">
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.06em]">JS Fragances · Panel</p>
              <p className="text-[11px] text-drift">{email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/" target="_blank" className="flex items-center gap-1 rounded-pill border border-cork px-3 py-1.5 text-[11px] uppercase text-sand hover:text-cream">
                <ExternalLink className="size-3.5" /> Ver tienda
              </Link>
              <form action={logout}>
                <button type="submit" className="flex items-center gap-1 rounded-pill border border-cork px-3 py-1.5 text-[11px] uppercase text-sand hover:text-cream">
                  <LogOut className="size-3.5" /> Salir
                </button>
              </form>
            </div>
          </div>
          <AdminNav />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </ToastProvider>
  );
}
