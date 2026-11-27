'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { getReviewerNameAction, submitReviewAction } from '@/controllers/review.controller';
import { visitorId } from '@/lib/analytics/track';
import { cn } from '@/lib/utils/cn';
import { COMMENT_MAX, LONGEVITY_OPTIONS, SILLAGE_OPTIONS } from '@/models/domain/reviews';
import type { Longevity, MyReview, Sillage } from '@/models/types';
import { Alert } from '@/views/shared/Alert';
import { Button } from '@/views/shared/Button';
import { Input, Label, Textarea } from '@/views/shared/Field';

const RATING_WORDS = ['', 'No me gustó', 'Regular', 'Bien', 'Muy bien', '¡Me encantó!'];

export type ReviewResult = { pending: boolean; verified: boolean };

/** Reseña de un perfume: nombre, estrellas, duración, estela y comentario. Funciona con o sin cuenta. */
export function ReviewForm({ fragranceId, initial, onDone, onCancel }: { fragranceId: string; initial?: MyReview; onDone: (r: ReviewResult & { name: string }) => void; onCancel: () => void }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [longevity, setLongevity] = useState<Longevity | null>(initial?.longevity ?? null);
  const [sillage, setSillage] = useState<Sillage | null>(initial?.sillage ?? null);
  const [comment, setComment] = useState(initial?.comment ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const shown = hover || rating;

  // Con sesión iniciada, llena el nombre con el de la cuenta.
  useEffect(() => {
    let cancelled = false;
    getReviewerNameAction()
      .then((n) => !cancelled && n && setName((prev) => prev || n))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError('Escribe tu nombre.');
    if (!rating) return setError('Elige de 1 a 5 estrellas.');
    setError(null);
    start(async () => {
      const res = await submitReviewAction({ fragranceId, rating, longevity, sillage, comment, name, visitor: visitorId() });
      if (!res.ok) return setError(res.error);
      router.refresh();
      onDone({ ...res.data, name: name.trim().split(/\s+/)[0] });
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-cork bg-walnut p-3">
      <label className="block">
        <Label>Tu nombre</Label>
        <Input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Ej. Miguel" autoComplete="given-name" />
        <span className="mt-1 block text-[11px] text-drift">Se publica solo tu nombre de pila.</span>
      </label>
      <fieldset>
        <legend className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-sand">Tu calificación</legend>
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
          {pending ? 'Enviando…' : initial ? 'Guardar cambios' : 'Enviar reseña'}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
      </div>
      <p className="text-[11px] text-drift">Si compraste este perfume con tu cuenta y ya te llegó, sale como “Compra verificada” y se publica al momento. Si no, sale como “Opinión” y se publica cuando la tienda la revise.</p>
    </form>
  );
}

function Choice<T extends string>({ label, options, value, onChange }: { label: string; options: Array<{ value: T; label: string }>; value: T | null; onChange: (v: T | null) => void }) {
  return (
    <fieldset>
      <legend className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-sand">{label}</legend>
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
