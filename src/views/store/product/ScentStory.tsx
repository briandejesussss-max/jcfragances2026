import Link from 'next/link';
import { FAMILY_BY_KEY, familiesOf, familyHref } from '@/models/domain/families';
import { notesPhrase, pyramidFor } from '@/models/domain/pyramid';
import { profileOf, splitOccasions } from '@/models/domain/profile';
import type { Fragrance } from '@/models/types';

const STAGES = [
  { key: 'top', kicker: 'Abre con', sub: 'Salida · lo primero que hueles' },
  { key: 'mid', kicker: 'Se transforma en', sub: 'Corazón · a la media hora' },
  { key: 'base', kicker: 'Y deja en tu piel', sub: 'Fondo · lo que dura horas' },
] as const;

/** Cómo huele, contado en palabras: familias, las tres etapas y para qué es ideal. */
export function ScentStory({ fragrance: f }: { fragrance: Fragrance }) {
  const pyramid = pyramidFor(f, true);
  const fams = familiesOf(f);
  const p = profileOf(f);
  const ideal = [
    ...new Set(
      [...splitOccasions(p.ocasion), ...p.clima.split(/[,/]| - /)]
        .map((x) => x.trim())
        .filter((x) => x && x.length < 30)
        .map((x) => (x === x.toUpperCase() ? x.toLowerCase() : x))
        .map((x) => x.charAt(0).toUpperCase() + x.slice(1)),
    ),
  ].slice(0, 6);
  const stages = pyramid ? STAGES.map((s) => ({ ...s, text: notesPhrase(pyramid[s.key], 3) })).filter((s) => s.text) : [];
  if (!fams.length && !stages.length && !ideal.length) return null;

  return (
    <section className="min-w-0 space-y-4 rounded-3xl border border-cork bg-umber p-4 sm:p-5">
      <h2 className="text-[11px] tracking-[0.14em] text-sand">Cómo huele</h2>
      {fams.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-[0.1em] text-drift">Familias olfativas</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {fams.map((k) => {
              const fam = FAMILY_BY_KEY.get(k)!;
              return (
                <Link key={k} href={familyHref(k)} className="inline-flex items-center gap-1.5 rounded-pill border border-cork bg-walnut/50 px-2.5 py-1 text-xs text-cream">
                  <span className="size-2 rounded-full" style={{ background: fam.colors[0] }} aria-hidden="true" />
                  {fam.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
      {stages.length > 0 && (
        <ol className="relative space-y-3 border-l border-dashed border-cork pl-4">
          {stages.map((s) => (
            <li key={s.key} className="relative">
              <span className="absolute -left-[1.3rem] top-1.5 size-2 rounded-full bg-ember" aria-hidden="true" />
              <p className="text-[11px] uppercase tracking-[0.1em] text-ember">{s.kicker}</p>
              <p className="font-semibold text-cream">{s.text}</p>
              <p className="text-xs text-drift">{s.sub}</p>
            </li>
          ))}
        </ol>
      )}
      {ideal.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-[0.1em] text-drift">Ideal para</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {ideal.map((x) => (
              <span key={x} className="rounded-pill bg-bark px-2.5 py-1 text-xs text-cream">
                {x}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
