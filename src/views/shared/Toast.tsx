'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type Notify = (message: string, ms?: number) => void;

const ToastContext = createContext<Notify>(() => {});

/** Avisos breves en la parte inferior de la pantalla. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const notify = useCallback<Notify>((text, ms = 2600) => {
    setMessage(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), ms);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex justify-center px-4">
        {message && (
          <div className="animate-fade-in pointer-events-auto max-w-md rounded-pill border border-cork bg-bark px-5 py-3 text-center text-xs text-cream">
            {message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
