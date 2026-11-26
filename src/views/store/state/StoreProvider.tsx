'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { track } from '@/lib/analytics/track';
import { formatPrice } from '@/lib/utils/format';
import { BOTTLE, reservedFor, sizesOf, sizeState } from '@/models/domain/sizes';
import type { CartLine, Currency, FragranceSummary, ReviewStat, SizeConfig, StoreConfig } from '@/models/types';
import { ToastProvider, useToast } from '@/views/shared/Toast';
import { usePersistentState } from './usePersistentState';

interface StoreContextValue {
  config: StoreConfig;
  sizes: SizeConfig[];
  fragrances: FragranceSummary[];
  byId: Map<string, FragranceSummary>;
  usdRate: number;
  reviewStats: Record<string, ReviewStat>;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  price: (value: number | undefined) => string;

  shelf: string[];
  toggleShelf: (id: string) => void;

  cart: CartLine[];
  addToCart: (id: string, size: string) => boolean;
  changeQty: (index: number, delta: number) => void;
  removeLine: (index: number) => void;
  clearCart: () => void;

  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

interface Props {
  config: StoreConfig;
  fragrances: FragranceSummary[];
  usdRate: number;
  reviewStats: Record<string, ReviewStat>;
  children: ReactNode;
}

export function StoreProvider(props: Props) {
  return (
    <ToastProvider>
      <StoreState {...props} />
    </ToastProvider>
  );
}

function StoreState({ config, fragrances, usdRate, reviewStats, children }: Props) {
  const notify = useToast();
  const sizes = useMemo(() => sizesOf(config), [config]);
  const byId = useMemo(() => new Map(fragrances.map((f) => [f.id, f])), [fragrances]);

  const [currency, setCurrencyState] = usePersistentState<Currency>('jf26_currency', 'MXN');
  const [shelf, setShelf] = usePersistentState<string[]>('jf26_user_shelf', []);
  const [cart, setCart] = usePersistentState<CartLine[]>('jf26_cart', []);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const setCurrency = useCallback(
    (c: Currency) => {
      if (c === 'USD' && !usdRate) {
        notify('No pudimos consultar el tipo de cambio; los precios siguen en MXN');
        return;
      }
      setCurrencyState(c);
    },
    [usdRate, notify, setCurrencyState],
  );

  const price = useCallback((value: number | undefined) => formatPrice(value, currency, usdRate), [currency, usdRate]);

  const toggleShelf = useCallback(
    (id: string) => {
      setShelf((prev) => {
        const has = prev.includes(id);
        notify(has ? 'Removido de tu estante personal' : 'Guardado en tu armario de fragancias ❤️');
        return has ? prev.filter((x) => x !== id) : [...prev, id];
      });
    },
    [setShelf, notify],
  );

  const addToCart = useCallback(
    (id: string, size: string) => {
      const f = byId.get(id);
      if (!f) return false;
      const st = sizeState(f, size, sizes, reservedFor(cart, f, sizes));
      if (!st.ok) {
        notify(st.reason ?? 'Opción no disponible', 3000);
        return false;
      }
      setCart((prev) => {
        const i = prev.findIndex((l) => l.fragId === id && l.size === size);
        if (i === -1) return [...prev, { fragId: id, size, qty: 1 }];
        return prev.map((l, j) => (j === i ? { ...l, qty: l.qty + 1 } : l));
      });
      const what = size === BOTTLE ? 'botella' : sizes.find((s) => s.key === size)?.label ?? size;
      notify(`Agregado a la bolsa: ${f.name} (${what})${st.onDemand ? ' · BAJO PEDIDO' : ''}`, 3000);
      track('add_to_cart', id);
      return true;
    },
    [byId, sizes, cart, setCart, notify],
  );

  const removeLine = useCallback((index: number) => setCart((prev) => prev.filter((_, i) => i !== index)), [setCart]);

  const changeQty = useCallback(
    (index: number, delta: number) => {
      const line = cart[index];
      if (!line) return;
      if (delta > 0) {
        addToCart(line.fragId, line.size);
        return;
      }
      setCart((prev) => prev.flatMap((l, i) => (i !== index ? [l] : l.qty + delta > 0 ? [{ ...l, qty: l.qty + delta }] : [])));
    },
    [cart, addToCart, setCart],
  );

  const clearCart = useCallback(() => setCart([]), [setCart]);

  const value: StoreContextValue = {
    config,
    sizes,
    fragrances,
    byId,
    usdRate,
    reviewStats,
    currency,
    setCurrency,
    price,
    shelf,
    toggleShelf,
    cart,
    addToCart,
    changeQty,
    removeLine,
    clearCart,
    cartOpen,
    setCartOpen,
    menuOpen,
    setMenuOpen,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore debe usarse dentro de <StoreProvider>');
  return ctx;
}
