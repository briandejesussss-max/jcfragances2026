import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { getCatalog } from '@/controllers/catalog.controller';
import { FAMILIES, FAMILY_BY_KEY, familiesOf, familyHref, type FamilyKey } from '@/models/domain/families';
import { buttonClass } from '@/views/shared/Button';
import { FragranceCard } from '@/views/store/catalog/FragranceCard';

// Igual que el inicio: estática y se regenera cuando cambia el catálogo
export const revalidate = 600;

export function generateStaticParams() {
  return FAMILIES.map((f) => ({ slug: f.key }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const fam = FAMILY_BY_KEY.get((await params).slug as FamilyKey);
  if (!fam) return {};
  return { title: `Perfumes ${fam.label.toLowerCase()}`, description: `${fam.label}: ${fam.hint.toLowerCase()}. Decants y botellas.` };
}

export default async function FamilyPage({ params }: { params: Promise<{ slug: string }> }) {
  const key = (await params).slug as FamilyKey;
  const fam = FAMILY_BY_KEY.get(key);
  if (!fam) notFound();
  const { fragrances } = await getCatalog();
  // Primero los que tienen esta familia como principal
  const list = fragrances
    .map((f) => ({ f, i: familiesOf(f).indexOf(key) }))
    .filter((x) => x.i >= 0)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.f);
  const counts = new Map(FAMILIES.map((x) => [x.key, fragrances.filter((f) => familiesOf(f).includes(x.key)).length]));

  return (
    <section className="mx-auto max-w-6xl px-4 pb-10 pt-6">
      <Link href="/#catalogo" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-sand">
        <ArrowLeft className="size-3.5" /> Catálogo
      </Link>
      <div className="mt-3 flex items-center gap-2" aria-hidden="true">
        {fam.colors.map((c) => (
          <span key={c} className="h-2 w-10 rounded-full" style={{ background: c }} />
        ))}
      </div>
      <h1 className="mt-3 text-[clamp(2rem,8vw,3.2rem)] font-extrabold leading-[1.02]">{fam.label}</h1>
      <p className="mt-1 text-sand">
        {fam.hint} · {list.length} {list.length === 1 ? 'perfume' : 'perfumes'}
      </p>

      {/* Otras familias, deslizables */}
      <nav aria-label="Otras familias" className="-mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {FAMILIES.map((x) => (
          <Link
            key={x.key}
            href={familyHref(x.key)}
            aria-current={x.key === key ? 'page' : undefined}
            className={`shrink-0 rounded-pill border px-3 py-1.5 text-sm ${x.key === key ? 'border-ember bg-ember/15 text-ember' : 'border-cork text-sand'}`}
          >
            {x.label} <span className="text-drift">{counts.get(x.key)}</span>
          </Link>
        ))}
      </nav>

      {list.length ? (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {list.map((f, i) => (
            <FragranceCard key={f.id} fragrance={f} priority={i < 3} />
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-2xl border border-cork bg-umber p-5 text-sand">Por ahora no tenemos perfumes de esta familia. Pronto llegan más.</p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3 rounded-3xl border border-cork bg-umber p-5">
        <Sparkles className="size-5 text-ember" aria-hidden="true" />
        <p className="flex-1 text-sand">¿Sigues con dudas? Te recomendamos 3 perfumes en 1 minuto.</p>
        <Link href="/encuentra-tu-perfume" className={buttonClass('primary', 'md')}>
          Encuentra tu perfume
        </Link>
      </div>
    </section>
  );
}
