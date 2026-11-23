'use client';

import { SmartImage } from '@/views/shared/SmartImage';
import Link from 'next/link';
import { Menu, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useStore } from '../state/StoreProvider';
import styles from './Header.module.css';

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'JS';

export function Header() {
  const { config, cart, setCartOpen, setMenuOpen } = useStore();
  const count = cart.reduce((a, l) => a + l.qty, 0);

  return (
    <header className={cn(styles.bar, 'sticky top-0 z-40')}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <button type="button" onClick={() => setMenuOpen(true)} aria-label="Abrir menú" className="rounded-full p-2 text-cream hover:bg-bark">
          <Menu className="size-5" />
        </button>

        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          {config.logo ? (
            <SmartImage src={config.logo} alt={config.name} width={36} height={36} className="size-9 rounded-full object-cover" />
          ) : (
            <span className="grid size-9 place-items-center rounded-full border border-cork text-xs font-medium">{initials(config.name)}</span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium uppercase tracking-[0.06em]">{config.name}</span>
            <span className="hidden truncate text-[10px] uppercase tracking-[0.1em] text-sand sm:block">{config.tagline}</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setCartOpen(true)}
          aria-label={`Abrir bolsa (${count} productos)`}
          className="relative flex items-center gap-2 rounded-pill bg-bark px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.06em] hover:bg-cork"
        >
          <ShoppingBag className="size-4" />
          <span className="hidden sm:inline">Bolsa</span>
          <span className={cn(styles.count, 'grid place-items-center rounded-full bg-ember px-1 text-[10px] text-cream')}>{count}</span>
        </button>
      </div>
    </header>
  );
}
