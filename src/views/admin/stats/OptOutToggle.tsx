'use client';

import { useSyncExternalStore } from 'react';
import { isOptedOut, setOptOut } from '@/lib/analytics/track';

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/** "No contar mis visitas": para que el dueño no infle las estadísticas al revisar la tienda. */
export function OptOutToggle() {
  const off = useSyncExternalStore(subscribe, isOptedOut, () => null);
  if (off === null) return null;
  return (
    <label className="flex shrink-0 cursor-pointer items-center gap-2 text-cream">
      <input
        type="checkbox"
        checked={off}
        onChange={(e) => {
          setOptOut(e.target.checked);
          listeners.forEach((l) => l());
        }}
        className="size-4 accent-[var(--color-ember)]"
      />
      No contar mis visitas en este dispositivo
    </label>
  );
}
