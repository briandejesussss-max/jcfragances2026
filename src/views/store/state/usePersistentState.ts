'use client';

import { useEffect, useRef, useState } from 'react';

/** Estado guardado en localStorage. Se lee después de montar para no romper la hidratación. */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura única de localStorage tras montar
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      // almacenamiento no disponible (modo privado): se usa el valor inicial
    }
    loaded.current = true;
  }, [key]);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // sin almacenamiento: el estado vive solo en esta pestaña
    }
  }, [key, value]);

  return [value, setValue] as const;
}
