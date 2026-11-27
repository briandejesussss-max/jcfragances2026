'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Home, LayoutGrid, ShoppingBag, UserRound, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useStore } from '../state/StoreProvider';
import styles from './MobileTabBar.module.css';

type Tab = { key: string; label: string; icon: LucideIcon; href?: string; onTap?: () => void };

/**
 * Barra de pestañas inferior en celular (como una app): Inicio, Catálogo, Favoritos, Bolsa y Cuenta.
 * Vidrio translúcido, respeta la barra del iPhone, la pestaña activa se marca con una "píldora"
 * que se desliza, y el número de la bolsa rebota cuando agregas algo.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const { cart, cartOpen, setCartOpen, shelf } = useStore();
  const count = cart.reduce((a, l) => a + l.qty, 0);
  const [hash, setHash] = useState('');

  // El número de la bolsa rebota cuando sube
  const prev = useRef(count);
  const [bump, setBump] = useState(0);
  useEffect(() => {
    if (count > prev.current) setBump((b) => b + 1);
    prev.current = count;
  }, [count]);

  useEffect(() => {
    const on = () => setHash(window.location.hash);
    on();
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, [pathname]);

  const tabs: Tab[] = [
    { key: 'inicio', label: 'Inicio', icon: Home, href: '/' },
    { key: 'catalogo', label: 'Catálogo', icon: LayoutGrid, href: '/#catalogo' },
    { key: 'favoritos', label: 'Favoritos', icon: Heart, href: '/#para-ti' },
    { key: 'bolsa', label: 'Bolsa', icon: ShoppingBag, onTap: () => setCartOpen(true) },
    { key: 'cuenta', label: 'Cuenta', icon: UserRound, href: '/cuenta' },
  ];

  const active = cartOpen
    ? 'bolsa'
    : pathname.startsWith('/cuenta')
      ? 'cuenta'
      : pathname === '/' && hash === '#catalogo'
        ? 'catalogo'
        : pathname === '/' && hash === '#para-ti'
          ? 'favoritos'
          : pathname === '/'
            ? 'inicio'
            : pathname.startsWith('/perfume')
              ? 'catalogo'
              : '';
  const activeIndex = tabs.findIndex((t) => t.key === active);

  return (
    <nav className={cn(styles.bar, 'app-tabbar')} aria-label="Navegación principal">
      <div className={styles.track}>
        {activeIndex >= 0 && <span className={styles.pill} style={{ translate: `${activeIndex * 100}% 0` }} aria-hidden="true" />}
        {tabs.map((t, i) => {
          const Icon = t.icon;
          const isActive = i === activeIndex;
          const inner = (
            <>
              <span className={styles.iconWrap}>
                <Icon className={cn('size-[22px]', t.key === 'favoritos' && shelf.length > 0 && 'fill-current')} strokeWidth={isActive ? 2.3 : 1.8} />
                {t.key === 'bolsa' && count > 0 && (
                  <span key={bump} className={styles.badge} aria-hidden="true">
                    {count}
                  </span>
                )}
              </span>
              <span className={styles.label}>{t.label}</span>
            </>
          );
          return t.href ? (
            <Link key={t.key} href={t.href} className={cn(styles.tab, isActive && styles.active)} aria-current={isActive ? 'page' : undefined} onClick={() => t.href?.includes('#') && setHash(t.href.slice(t.href.indexOf('#')))}>
              {inner}
            </Link>
          ) : (
            <button key={t.key} type="button" className={cn(styles.tab, isActive && styles.active)} onClick={t.onTap} aria-label={`${t.label} (${count} productos)`}>
              {inner}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
