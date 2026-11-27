import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { FAMILIES, familyHref } from '@/models/domain/families';
import { buttonClass } from '@/views/shared/Button';

/** Inicio: invitación al cuestionario y accesos por familia olfativa. */
export function FinderPromo() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="aurora-card relative overflow-hidden rounded-3xl border border-cork bg-umber p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-ember/10 blur-3xl" aria-hidden="true" />
        <div className="relative grid gap-5 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-ember">
              <Sparkles className="size-3.5" /> Guía para elegir
            </p>
            <h2 className="mt-2 text-[clamp(1.7rem,6vw,2.4rem)] font-extrabold leading-[1.05]">¿No sabes cuál elegir?</h2>
            <p className="mt-2 text-sand">Contesta 6 preguntas y te recomendamos 3 perfumes, con el porqué de cada uno.</p>
            <Link href="/encuentra-tu-perfume" className={buttonClass('primary', 'lg', 'mt-4')}>
              Encuentra tu perfume <ArrowRight className="size-4" />
            </Link>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-sand">O explora por aroma</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {FAMILIES.map((f) => (
                <Link key={f.key} href={familyHref(f.key)} className="flex items-center gap-1.5 rounded-pill border border-cork bg-walnut/40 px-3 py-1.5 text-sm text-cream">
                  <span className="flex gap-0.5" aria-hidden="true">
                    {f.colors.map((c) => (
                      <span key={c} className="size-2 rounded-full" style={{ background: c }} />
                    ))}
                  </span>
                  {f.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
