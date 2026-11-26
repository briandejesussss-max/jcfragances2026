'use client';

import Link, { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Calculator, ClipboardList, FlaskConical, LineChart, LoaderCircle, Package, Star, Store, Users, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const ITEMS: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList },
  { href: '/admin/fragancias', label: 'Fragancias', icon: FlaskConical },
  { href: '/admin/inventario', label: 'Inventario', icon: Package },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/resenas', label: 'Reseñas', icon: Star },
  { href: '/admin/estadisticas', label: 'Estadísticas', icon: BarChart3 },
  { href: '/admin/finanzas', label: 'Finanzas', icon: LineChart },
  { href: '/admin/calculadoras', label: 'Calculadoras', icon: Calculator },
  { href: '/admin/tienda', label: 'Tienda', icon: Store },
];

/** Ícono de la pestaña: se vuelve un indicador de carga en cuanto la tocas. */
function TabIcon({ icon: Icon }: { icon: LucideIcon }) {
  const { pending } = useLinkStatus();
  return pending ? <LoaderCircle className="size-3.5 animate-spin" aria-label="Cargando" /> : <Icon className="size-3.5" />;
}

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Secciones del panel">
      {ITEMS.map(({ href, label, icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-pill border px-3 py-1.5 text-[11px] uppercase tracking-[0.06em] transition active:scale-95',
              active ? 'border-cream bg-cream text-walnut' : 'border-cork text-sand hover:text-cream',
            )}
          >
            <TabIcon icon={icon} /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
