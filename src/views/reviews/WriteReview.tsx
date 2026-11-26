'use client';

import { useState } from 'react';
import { Check, PenLine } from 'lucide-react';
import { Button } from '@/views/shared/Button';
import { ReviewForm, type ReviewResult } from './ReviewForm';

/** Botón "Escribir reseña" de la ficha: abre el formulario y muestra el agradecimiento. */
export function WriteReview({ fragranceId }: { fragranceId: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<(ReviewResult & { name: string }) | null>(null);

  if (done)
    return (
      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-ok/50 p-4 text-sm" role="status">
        <Check className="mt-0.5 size-5 shrink-0 text-ok" />
        <p>
          {done.pending
            ? `¡Gracias, ${done.name}! Tu reseña se publicará en cuanto la tienda la revise.`
            : `¡Gracias, ${done.name}! Tu reseña ya está publicada como “Compra verificada”.`}
        </p>
      </div>
    );

  if (open)
    return (
      <div className="mt-4">
        <ReviewForm fragranceId={fragranceId} onDone={setDone} onCancel={() => setOpen(false)} />
      </div>
    );

  return (
    <Button variant="cream" className="mt-4 w-full" onClick={() => setOpen(true)}>
      <PenLine className="size-4" /> Escribir reseña
    </Button>
  );
}
