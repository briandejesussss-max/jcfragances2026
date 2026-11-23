'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { CompactNotesSection } from '@/models/domain/pyramid';
import { cn } from '@/lib/utils/cn';

/** Notas en formato compacto (celular): secciones en línea separadas por comas, recortadas con "Ver todas". */
export function CompactNotesText({ sections }: { sections: CompactNotesSection[] }) {
  const [open, setOpen] = useState(false);
  const total = sections.reduce((a, s) => a + s.notes.length, 0);
  const long = total > 8;

  return (
    <div className="text-sm leading-relaxed text-sand">
      <div className={cn('space-y-1.5', long && !open && 'line-clamp-4')}>
        {sections.map((s, i) => (
          <p key={`${s.title}-${i}`} className={cn(long && !open && 'inline')}>
            {s.title && <b className="font-medium text-cream">{s.title}: </b>}
            {s.notes.join(', ')}.{long && !open && i < sections.length - 1 ? ' ' : ''}
          </p>
        ))}
      </div>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="mt-2 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.08em] text-cream underline-offset-4 hover:underline"
        >
          {open ? 'Ver menos' : `Ver todas las notas (${total})`}
          <ChevronDown className={cn('size-3.5 transition', open && 'rotate-180')} />
        </button>
      )}
    </div>
  );
}
