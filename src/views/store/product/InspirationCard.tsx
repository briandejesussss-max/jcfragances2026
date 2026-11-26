import { FlaskConical, Sparkles } from 'lucide-react';
import { similarityOf, inspirationTitle } from '@/models/domain/inspiration';
import type { Inspiration } from '@/models/types';
import { SmartImage } from '@/views/shared/SmartImage';

/** "Inspirado en Creed · Aventus" con qué tan parecido es, foto de referencia y nota corta. */
export function InspirationCard({ inspiration: i }: { inspiration: Inspiration }) {
  const sim = similarityOf(i.similarity);
  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-cork bg-walnut/60 p-2.5 backdrop-blur-sm">
      <div className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-cork bg-bark">
        {i.image ? (
          <SmartImage src={i.image} alt={`Referencia: ${inspirationTitle(i, ' ')}`} fill sizes="56px" className="object-contain p-1" />
        ) : (
          <FlaskConical className="size-6 text-sand" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0">
        <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] text-ember">
          <Sparkles className="size-3" /> Inspirado en
        </span>
        <strong className="block truncate text-sm font-medium">{inspirationTitle(i)}</strong>
        <span className="flex items-center gap-1.5 text-[11px] text-sand">
          <span className="inline-flex gap-1" aria-hidden="true">
            {[1, 2, 3].map((n) => (
              <span key={n} className={`size-1.5 rounded-full ${n <= sim.dots ? 'bg-ember' : 'bg-cork'}`} />
            ))}
          </span>
          {sim.label}
        </span>
        {i.note && <span className="block text-[11px] italic text-drift">“{i.note}”</span>}
      </div>
    </div>
  );
}
