'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { submitReviewAction } from '@/controllers/review.controller';
import { cn } from '@/lib/utils/cn';
import { COMMENT_MAX, LONGEVITY_OPTIONS, SILLAGE_OPTIONS } from '@/models/domain/reviews';
import type { Longevity, MyReview, Sillage } from '@/models/types';
import { Alert } from '@/views/shared/Alert';
import { Button } from '@/views/shared/Button';
import { Label, Textarea } from '@/views/shared/Field';

const RATING_WORDS = ['', 'No me gustó', 'Regular', 'Bien', 'Muy bien', '¡Me encantó!'];

/** Calificación de un perfume comprado: estrellas, duración, estela y comentario. */
export function ReviewForm({ fragranceId, initial, onDone }: { fragranceId: string; initial?: MyReview; onDone: () => void }) {
  const router = useRouter();
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [longevity, setLongevity] = useState<Longevity | null>(initial?.longevity ?? null);
  const [sillage, setSillage] = useState<Sillage | null>(initial?.sillage ?? null);
  const [comment, setComment] = useState(initial?.comment ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const shown = hover || rating;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return setError('Elige de 1 a 5 estrellas.');
    setError(null);
    start(async () => {
      const res = await submitReviewAction({ fragranceId, rating, longevity, sillage, comment });
      if (!res.ok) return setError(res.error);
      router.refresh();
      onDone();
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-cork bg-walnut p-3">
      <fieldset>
        <legend className="mb-1 text-[10px] font-medium uppercase tracking-[0.08em] text-sand">Tu calificación</legend>
        <div className="flex items-center gap-2" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
              aria-pressed={rating === n}
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
              className="grid size-10 place-items-center rounded-full hover:bg-bark"
            >
              <Star className={cn('size-6', n <= shown ? 'fill-ember text-ember' : 'text-cork')} />
            </button>
          ))}
          <span className="text-xs text-sand">{RATING_WORDS[shown]}</span>
        </div>
      </fieldset>

      <Choice label="¿Cuánto te duró?" options={LONGEVITY_OPTIONS} value={longevity} onChange={setLongevity} />
      <Choice label="¿Cómo fue su estela?" options={SILLAGE_OPTIONS} value={sillage} onChange={setSillage} />

      <label className="block">
        <Label>Comentario (opcional)</Label>
        <Textarea value={comment} maxLength={COMMENT_MAX} onChange={(e) => setComment(e.target.value)} placeholder="¿Qué te pareció? ¿Para qué ocasión lo usas?" />
        <span className="mt-1 block text-right text-[11px] text-drift">
          {comment.length}/{COMMENT_MAX}
        </span>
      </label>
      {error && <Alert>{error}</Alert>}
      <div className="flex gap-2">
        <Button type="submit" variant="cream" disabled={pending}>
          {pending ? 'Guardando…' : initial ? 'Guardar cambios' : 'Publicar reseña'}
        </Button>
        <Button variant="ghost" onClick={onDone} disabled={pending}>
          Cancelar
        </Button>
      </div>
      <p className="text-[11px] text-drift">Se publica con tu nombre de pila y la etiqueta “Compra verificada”.</p>
    </form>
  );
}

function Choice<T extends string>({ label, options, value, onChange }: { label: string; options: Array<{ value: T; label: string }>; value: T | null; onChange: (v: T | null) => void }) {
  return (
    <fieldset>
      <legend className="mb-1 text-[10px] font-medium uppercase tracking-[0.08em] text-sand">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(value === o.value ? null : o.value)}
            className={cn('rounded-pill border px-3 py-1.5 text-xs', value === o.value ? 'border-cream bg-cream text-walnut' : 'border-cork text-sand hover:text-cream')}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
