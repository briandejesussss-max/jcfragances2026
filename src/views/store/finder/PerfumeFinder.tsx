'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Pencil, ShoppingBag, Sparkles, Star, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { fragranceSlug } from '@/lib/utils/slug';
import { FAMILIES, type FamilyKey } from '@/models/domain/families';
import {
  answerChips,
  CLIMATE_OPTIONS,
  FINDER_STEPS,
  FORMAT_OPTIONS,
  recommend,
  STYLE_OPTIONS,
  USE_OPTIONS,
  WHEN_OPTIONS,
  type FinderAnswers,
  type FinderOption,
} from '@/models/domain/finder';
import { presentationLabel } from '@/models/domain/sizes';
import type { Fragrance } from '@/models/types';
import { buttonClass } from '@/views/shared/Button';
import { SmartImage } from '@/views/shared/SmartImage';
import { useStore } from '../state/StoreProvider';
import { usePersistentState } from '../state/usePersistentState';
import styles from './PerfumeFinder.module.css';

const QUESTIONS: Record<(typeof FINDER_STEPS)[number], { title: string; hint: string }> = {
  style: { title: '¿Qué estilo buscas?', hint: 'Casi todos nuestros perfumes son unisex. Esto solo acomoda el orden.' },
  families: { title: '¿Qué tipo de aroma te gusta?', hint: 'Elige hasta 2. Si no sabes, toca «Sorpréndeme».' },
  use: { title: '¿Para qué lo quieres?', hint: 'Piensa en dónde lo vas a usar más.' },
  climate: { title: '¿Con qué clima lo usarías?', hint: 'Hay perfumes que lucen más con calor y otros con frío.' },
  format: { title: '¿Cómo lo quieres?', hint: 'Un decant es una muestra para probarlo antes de comprar la botella.' },
  when: { title: '¿Cuándo lo necesitas?', hint: 'Si puedes esperar, también te enseñamos los que pedimos especialmente para ti.' },
};

/** Pantalla: 'intro' → pasos 0..5 → 'results' */
type Screen = 'intro' | number | 'results';

export function PerfumeFinder() {
  const { fragrances, sizes, reviewStats } = useStore();
  const [screen, setScreen] = useState<Screen>('intro');
  // Se recuerdan las últimas respuestas para "Cambiar respuestas" y para volver a los resultados
  const [answers, setAnswers] = usePersistentState<FinderAnswers>('jf26_finder', {});
  const [picked, setPicked] = useState<FamilyKey[]>([]);

  const go = (s: Screen) => {
    setScreen(s);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };
  const answer = (patch: Partial<FinderAnswers>, step: number) => {
    setAnswers((a) => ({ ...a, ...patch }));
    if (step >= FINDER_STEPS.length - 1) go('results');
    else go(step + 1);
  };

  if (screen === 'intro')
    return (
      <Intro
        hasPrevious={!!answers.when}
        onStart={() => {
          setAnswers({});
          setPicked([]);
          go(0);
        }}
        onPrevious={() => go('results')}
      />
    );
  if (screen === 'results')
    return (
      <Results
        answers={answers}
        onEdit={() => {
          setPicked(answers.families ?? []);
          go(0);
        }}
        onRestart={() => {
          setAnswers({});
          setPicked([]);
          go(0);
        }}
        list={fragrances}
        sizes={sizes}
        rating={(id) => reviewStats[id]?.average ?? 0}
      />
    );

  const step = screen;
  const key = FINDER_STEPS[step];
  const q = QUESTIONS[key];

  return (
    <section className={cn('mx-auto flex max-w-xl flex-col px-4 pb-6 pt-3', styles.screen)} aria-labelledby="finder-q">
      {/* Barra superior: atrás, "Pregunta N de 6", cerrar */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => go(step === 0 ? 'intro' : step - 1)} aria-label="Pregunta anterior" className="grid size-10 place-items-center rounded-full text-sand hover:bg-bark">
          <ArrowLeft className="size-5" />
        </button>
        <p className="text-sm text-sand">
          {step === FINDER_STEPS.length - 1 ? 'Última pregunta' : `Pregunta ${step + 1} de ${FINDER_STEPS.length}`}
        </p>
        <button type="button" onClick={() => go('intro')} aria-label="Salir del cuestionario" className="grid size-10 place-items-center rounded-full text-sand hover:bg-bark">
          <X className="size-5" />
        </button>
      </div>
      <div className="mt-2 flex gap-1.5" aria-hidden="true">
        {FINDER_STEPS.map((s, i) => (
          <span key={s} className={cn(styles.seg, i <= step && styles.segOn)} />
        ))}
      </div>

      <div key={key} className={styles.stepIn}>
        <h1 id="finder-q" className="mt-6 text-[1.7rem] font-extrabold leading-tight">
          {q.title}
        </h1>
        <p className="mt-1.5 text-sm text-sand">{q.hint}</p>

        {key === 'families' ? (
          <>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {FAMILIES.map((f) => {
                const on = picked.includes(f.key);
                const full = !on && picked.length >= 2;
                return (
                  <button
                    key={f.key}
                    type="button"
                    aria-pressed={on}
                    disabled={full}
                    onClick={() => setPicked((p) => (on ? p.filter((k) => k !== f.key) : [...p, f.key].slice(0, 2)))}
                    className={cn(styles.option, styles.family, on && styles.optionOn)}
                  >
                    <span className="flex gap-1" aria-hidden="true">
                      {f.colors.map((c) => (
                        <span key={c} className="h-1.5 w-6 rounded-full" style={{ background: c }} />
                      ))}
                    </span>
                    <span className="mt-2 block font-semibold leading-tight text-cream">{f.label}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-sand">{f.hint}</span>
                    {on && <Check className="absolute right-2.5 top-2.5 size-4 text-ember" aria-hidden="true" />}
                  </button>
                );
              })}
              <button type="button" onClick={() => answer({ families: [] }, step)} className={cn(styles.option, styles.family, 'col-span-2 flex items-center gap-2')}>
                <Sparkles className="size-4 text-ember" aria-hidden="true" />
                <span className="font-semibold text-cream">Sorpréndeme</span>
                <span className="text-xs text-sand">· No sé, recomiéndenme</span>
              </button>
            </div>
            <div className={styles.stickyNext}>
              <button type="button" disabled={!picked.length} onClick={() => answer({ families: picked }, step)} className={buttonClass('primary', 'lg', 'w-full')}>
                Siguiente
              </button>
              <p className="mt-1.5 text-center text-xs text-drift">Elegiste {picked.length} de 2</p>
            </div>
          </>
        ) : (
          <Options
            options={({ style: STYLE_OPTIONS, use: USE_OPTIONS, climate: CLIMATE_OPTIONS, format: FORMAT_OPTIONS, when: WHEN_OPTIONS } as Record<string, FinderOption<string>[]>)[key]}
            selected={answers[key as keyof FinderAnswers] as string | undefined}
            onPick={(v) => answer({ [key]: v } as Partial<FinderAnswers>, step)}
          />
        )}
      </div>
    </section>
  );
}

function Options({ options, selected, onPick }: { options: FinderOption<string>[]; selected?: string; onPick: (v: string) => void }) {
  return (
    <div className="mt-5 space-y-2.5">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onPick(o.value)} className={cn(styles.option, 'flex w-full items-center justify-between gap-3', selected === o.value && styles.optionOn)}>
          <span className="min-w-0 text-left">
            <span className="block font-semibold text-cream">{o.label}</span>
            {o.hint && <span className="block text-xs text-sand">{o.hint}</span>}
          </span>
          <span aria-hidden="true" className="text-drift">
            ›
          </span>
        </button>
      ))}
      <p className="pt-3 text-center text-xs text-drift">Toca una opción para seguir</p>
    </div>
  );
}

function Intro({ onStart, hasPrevious, onPrevious }: { onStart: () => void; hasPrevious: boolean; onPrevious: () => void }) {
  const steps = [
    ['Contestas 6 preguntas', 'Qué te gusta, cuándo lo usarías y cómo lo quieres'],
    ['Te damos 3 perfumes', 'Con el porqué de cada uno, solo de los que tenemos'],
    ['Eliges decant o botella', 'Pruébalo en 3, 5 o 10 ml, o llévate el frasco'],
  ];
  return (
    <section className="mx-auto max-w-xl px-4 pb-10 pt-8">
      <p className="text-[11px] uppercase tracking-[0.2em] text-ember">✦ Guía para elegir</p>
      <h1 className="mt-2 text-[clamp(2rem,8vw,2.8rem)] font-extrabold leading-[1.02]">¿No sabes cuál elegir?</h1>
      <p className="mt-2 text-sand">Te recomendamos 3 perfumes en 1 minuto.</p>
      <ol className="mt-6 space-y-3">
        {steps.map(([t, d], i) => (
          <li key={t} className="flex gap-3 rounded-2xl border border-cork bg-umber/70 p-3.5">
            <span className={styles.num}>{i + 1}</span>
            <span>
              <span className="block font-semibold text-cream">{t}</span>
              <span className="block text-sm text-sand">{d}</span>
            </span>
          </li>
        ))}
      </ol>
      <button type="button" onClick={onStart} className={buttonClass('primary', 'lg', 'mt-6 w-full')}>
        Empezar
      </button>
      {hasPrevious && (
        <button type="button" onClick={onPrevious} className="mt-3 w-full text-center text-sm text-sand underline underline-offset-4">
          Ver mis resultados anteriores
        </button>
      )}
    </section>
  );
}

function Results({
  answers,
  onEdit,
  onRestart,
  list,
  sizes,
  rating,
}: {
  answers: FinderAnswers;
  onEdit: () => void;
  onRestart: () => void;
  list: ReturnType<typeof useStore>['fragrances'];
  sizes: ReturnType<typeof useStore>['sizes'];
  rating: (id: string) => number;
}) {
  const { price, addToCart } = useStore();
  const [more, setMore] = useState(false);
  const results = useMemo(() => recommend(list, sizes, answers, rating), [list, sizes, answers, rating]);
  const perfect = results.filter((r) => r.perfect).length;
  const shown = results.slice(0, more ? 6 : 3);

  return (
    <section className="mx-auto max-w-3xl px-4 pb-10 pt-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-ember">✦ Tus resultados</p>
      <h1 className="mt-1 text-[clamp(1.9rem,7vw,2.6rem)] font-extrabold leading-tight">{results.length ? `Estos ${Math.min(3, results.length)} son para ti` : 'No encontramos uno exacto'}</h1>
      <p className="mt-1 text-sm text-sand">
        {results.length
          ? perfect
            ? `${perfect} ${perfect === 1 ? 'cumple' : 'cumplen'} todo lo que pediste. Primero, los que mejor encajan.`
            : 'Ninguno cumple todo al 100%, así que te enseñamos los más cercanos.'
          : 'Prueba cambiar alguna respuesta o escríbenos por WhatsApp y te ayudamos.'}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {answerChips(answers).map((c) => (
          <span key={c} className="rounded-pill border border-cork px-2.5 py-1 text-xs text-sand">
            {c}
          </span>
        ))}
      </div>
      <button type="button" onClick={onEdit} className="mt-3 inline-flex items-center gap-1.5 text-sm text-ember">
        <Pencil className="size-3.5" /> Cambiar respuestas
      </button>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {shown.map((r, i) => {
          const f = r.fragrance;
          const href = `/perfume/${fragranceSlug(f)}`;
          const label = presentationLabel(sizes, f as Fragrance, r.offer.key);
          const best = i === 0;
          return (
            <article key={f.id} className={cn('relative overflow-hidden rounded-3xl border border-cork bg-umber', best && 'sm:col-span-2', styles.result)} style={{ animationDelay: `${i * 70}ms` }}>
              <div className={cn('flex gap-4 p-4', best ? 'flex-col sm:flex-row' : 'items-center')}>
                <Link href={href} className={cn('relative shrink-0 overflow-hidden rounded-2xl bg-walnut', best ? 'aspect-square w-full sm:w-60' : 'size-24')}>
                  {f.image && <SmartImage src={f.image} alt={`${f.brand} ${f.name}`} fill sizes={best ? '(max-width: 640px) 90vw, 240px' : '96px'} className="object-contain p-2" />}
                </Link>
                <div className="min-w-0 flex-1">
                  {best ? (
                    <span className="inline-flex items-center gap-1 rounded-pill bg-ember/15 px-2.5 py-1 text-[11px] font-semibold text-ember">
                      <Star className="size-3 fill-current" /> Tu mejor opción
                    </span>
                  ) : (
                    <span className="text-[11px] uppercase tracking-[0.14em] text-drift">Opción {i + 1}</span>
                  )}
                  <p className="mt-1.5 text-xs uppercase tracking-[0.14em] text-sand">{f.brand}</p>
                  <Link href={href} className={cn('block font-extrabold leading-tight text-cream', best ? 'text-2xl' : 'text-lg')}>
                    {f.name}
                  </Link>
                  {best ? (
                    <>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-sand">Por qué te lo recomendamos</p>
                      <ul className="mt-1.5 space-y-1 text-sm text-cream">
                        {r.reasons.map((x) => (
                          <li key={x} className="flex gap-2">
                            <Check className="mt-0.5 size-4 shrink-0 text-ember" aria-hidden="true" />
                            {x}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="mt-0.5 line-clamp-2 text-xs text-sand">{r.reasons.join(' · ')}</p>
                  )}
                  <div className={cn('flex flex-wrap items-center gap-2', best ? 'mt-4' : 'mt-2')}>
                    <button
                      type="button"
                      onClick={() => addToCart(f.id, r.offer.key)}
                      className={buttonClass('primary', best ? 'md' : 'sm')}
                      aria-label={`Agregar ${f.name} ${label} a la bolsa`}
                    >
                      <ShoppingBag className="size-4" /> {label} · {price(r.offer.price)}
                    </button>
                    {best && (
                      <Link href={href} className={buttonClass('ghost', 'md')}>
                        Ver el perfume
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {!more && results.length > 3 && (
          <button type="button" onClick={() => setMore(true)} className={buttonClass('ghost', 'md')}>
            Ver 3 más
          </button>
        )}
        <button type="button" onClick={onRestart} className="text-sm text-sand underline underline-offset-4">
          Empezar de nuevo
        </button>
      </div>
    </section>
  );
}
