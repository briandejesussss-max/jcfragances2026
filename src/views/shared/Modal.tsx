'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const WIDTH = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' };

/** Ventana modal accesible sobre <dialog>: Escape y clic fuera la cierran. */
export function Modal({ open, onClose, title, children, size = 'md', className }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cn(
        'm-auto max-h-[92dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-3xl border border-cork bg-umber p-0 text-cream',
        WIDTH[size],
        className,
      )}
    >
      {open && (
        <div className="animate-fade-in p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            {title ? <h2 className="text-lg">{title}</h2> : <span />}
            <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-full p-1.5 text-sand hover:bg-bark hover:text-cream">
              <X className="size-5" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
