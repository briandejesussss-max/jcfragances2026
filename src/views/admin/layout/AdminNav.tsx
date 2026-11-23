'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calculator, ClipboardList, FlaskConical, LineChart, Package, Store } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const ITEMS = [
  { href: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList },
  { href: '/admin/fragancias', label: 'Fragancias', icon: FlaskConical },
  { href: '/admin/inventario', label: 'Inventario', icon: Package },
  { href: '/admin/finanzas', label: 'Finanzas', icon: LineChart },
  { href: '/admin/calculadoras', label: 'Calculadoras', icon: Calculator },
  { href: '/admin/tienda', label: 'Tienda', icon: Store },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Secciones del panel">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-pill border px-3 py-1.5 text-[11px] uppercase tracking-[0.06em]',
              active ? 'border-cream bg-cream text-walnut' : 'border-cork text-sand hover:text-cream',
            )}
          >
            <Icon className="size-3.5" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
