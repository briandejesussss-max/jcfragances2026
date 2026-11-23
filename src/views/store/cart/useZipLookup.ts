'use client';

import { useEffect, useState } from 'react';
import type { ZipInfo } from '@/models/domain/address';

type Status = 'idle' | 'loading' | 'ok' | 'error';

/** Consulta el C.P. (vía /api/codigo-postal) cuando tiene 5 dígitos. */
export function useZipLookup(cp: string) {
  const [state, setState] = useState<{ status: Status; info: ZipInfo | null }>({ status: 'idle', info: null });

  useEffect(() => {
    if (!/^\d{5}$/.test(cp)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reinicia la búsqueda al borrar el C.P.
      setState({ status: 'idle', info: null });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading', info: null });
    fetch(`/api/codigo-postal/${cp}`)
      .then((r) => (r.ok ? (r.json() as Promise<ZipInfo>) : null))
      .then((info) => !cancelled && setState({ status: info ? 'ok' : 'error', info }))
      .catch(() => !cancelled && setState({ status: 'error', info: null }));
    return () => {
      cancelled = true;
    };
  }, [cp]);

  return state;
}
