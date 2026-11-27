import { FlaskConical, Sparkles } from 'lucide-react';
import { inspirationBrands, inspirationRefs, inspirationTitle, refTitle, similarityOf } from '@/models/domain/inspiration';
import type { Inspiration, InspirationRef } from '@/models/types';
import { cn } from '@/lib/utils/cn';
import { SmartImage } from '@/views/shared/SmartImage';

/**
 * "Inspirado en Creed · Aventus" con qué tan parecido es, foto(s) de referencia y nota corta.
 * Híbridos (2 a 4 originales): las miniaturas se acomodan dentro del mismo cuadro.
 */
export function InspirationCard({ inspiration: i }: { inspiration: Inspiration }) {
  const sim = similarityOf(i.similarity);
  const refs = inspirationRefs(i);
  const hybrid = refs.length > 1;
  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-cork bg-walnut/60 p-2.5 backdrop-blur-sm">
      <Thumbs refs={refs} />
      <div className="min-w-0">
        <span className="flex items-center gap-1 text-[11px] uppercase tracking-[0.1em] text-ember">
          <Sparkles className="size-3" /> {hybrid ? `Híbrido · inspirado en ${refs.length}` : 'Inspirado en'}
        </span>
        <strong className="line-clamp-2 text-sm font-medium" title={refs.map((r) => refTitle(r)).join(' + ')}>
          {inspirationTitle(i)}
        </strong>
        {hybrid && inspirationBrands(i) && <span className="block truncate text-[11px] text-sand">{inspirationBrands(i)}</span>}
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

function Thumbs({ refs }: { refs: InspirationRef[] }) {
  const n = refs.length;
  return (
    <div className={cn('grid shrink-0 gap-0.5 overflow-hidden rounded-xl border border-cork bg-bark', n > 1 ? 'size-[4.5rem]' : 'size-14', n === 2 ? 'grid-cols-2' : n > 2 ? 'grid-cols-2 grid-rows-2' : '')}>
      {refs.slice(0, 4).map((r, k) => (
        <div key={k} className={cn('relative grid place-items-center bg-bark', n === 3 && k === 0 && 'row-span-2')}>
          {r.image ? (
            <SmartImage src={r.image} alt={`Referencia: ${refTitle(r, ' ')}`} fill sizes="56px" className={cn('object-contain', n > 1 ? 'p-0.5' : 'p-1')} />
          ) : (
            <FlaskConical className={n > 1 ? 'size-3.5 text-sand' : 'size-6 text-sand'} aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  );
}
