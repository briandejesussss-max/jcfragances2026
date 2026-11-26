import { profileOf, splitLines, splitOccasions } from '@/models/domain/profile';
import type { Fragrance } from '@/models/types';

/** "Radiografía olfativa": estela, audiencia, clima, ocasión, puntos fuertes y a considerar. */
export function CommunityProfile({ fragrance }: { fragrance: Fragrance }) {
  const p = profileOf(fragrance);
  const stats = [
    { k: 'Estela', v: p.estela },
    { k: 'Audiencia', v: p.audiencia },
    { k: 'Clima', v: p.clima },
    { k: 'Ocasión', v: splitOccasions(p.ocasion).join(' • ') },
  ];
  return (
    <section id="veredicto" className="scroll-mt-20 rounded-3xl border border-cork bg-umber p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[11px] tracking-[0.14em] text-sand">Radiografía olfativa</h2>
        <span className="rounded-full border border-cork px-2 py-0.5 text-[9px] uppercase text-sand">Ficha de la tienda</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.k} className="rounded-2xl bg-bark/50 p-3">
            <span className="block text-[10px] uppercase tracking-[0.08em] text-sand">{s.k}</span>
            <strong className="mt-1 block text-sm font-medium">{s.v}</strong>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <List title="👍 Puntos fuertes" items={splitLines(p.fuertes)} />
        <List title="⚠️ A considerar" items={splitLines(p.considerar)} />
      </div>
    </section>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-cork p-3 text-sm">
      <strong className="text-xs font-medium uppercase">{title}</strong>
      <ul className="mt-2 space-y-1 text-sand">
        {items.map((t) => (
          <li key={t}>• {t}</li>
        ))}
      </ul>
    </div>
  );
}
