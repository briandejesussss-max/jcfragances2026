'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { PLACEHOLDER_IMAGE } from '@/config/store';
import { deleteFragranceAction } from '@/controllers/fragrance.controller';
import { fragranceSlug } from '@/lib/utils/slug';
import { formatMl, formatPrice } from '@/lib/utils/format';
import { filterCatalog, DEFAULT_FILTER } from '@/models/domain/catalog';
import { hasBottleStock, hasMlStock, minSizePrice, sizesOf } from '@/models/domain/sizes';
import type { FragranceSummary, StoreConfig } from '@/models/types';
import { buttonClass } from '@/views/shared/Button';
import { Input } from '@/views/shared/Field';
import { useToast } from '@/views/shared/Toast';
import { PageTitle } from '../shared/PageTitle';

export function FragranceList({ fragrances, config }: { fragrances: FragranceSummary[]; config: StoreConfig }) {
  const [query, setQuery] = useState('');
  const [pending, start] = useTransition();
  const router = useRouter();
  const notify = useToast();
  const sizes = sizesOf(config);
  const list = useMemo(() => filterCatalog([...fragrances], { ...DEFAULT_FILTER, query }), [fragrances, query]);

  const remove = (f: FragranceSummary) => {
    if (!confirm(`¿Eliminar ${f.brand} ${f.name}? No se puede deshacer.`)) return;
    start(async () => {
      const res = await deleteFragranceAction(f.id);
      notify(res.ok ? 'Fragancia eliminada' : res.error);
      router.refresh();
    });
  };

  return (
    <>
      <PageTitle title={`Fragancias (${fragrances.length})`}>
        <Link href="/admin/fragancias/nueva" className={buttonClass('cream', 'md')}>
          <Plus className="size-4" /> Nueva fragancia
        </Link>
      </PageTitle>
      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, casa o nota…" className="mb-4" />
      <div className="divide-y divide-dashed divide-cork overflow-hidden rounded-3xl border border-cork bg-umber">
        {list.map((f) => (
          <div key={f.id} className="flex items-center gap-3 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- miniatura del panel */}
            <img src={f.image || PLACEHOLDER_IMAGE(f.name)} alt="" className="size-12 shrink-0 rounded-xl bg-walnut object-contain" />
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] uppercase tracking-[0.08em] text-sand">{f.brand}</span>
              <Link href={`/perfume/${fragranceSlug(f)}`} target="_blank" className="block truncate text-sm hover:text-ember">
                {f.name}
              </Link>
              <span className="text-[11px] text-drift">
                {f.comingSoon ? '⏳ Próximamente' : `Desde ${formatPrice(minSizePrice(sizes, f))}`} · 🍾 {hasBottleStock(f) ? f.stock?.bottles : '—'} · 💧{' '}
                {hasMlStock(f) ? `${formatMl(f.stock?.ml ?? 0)} ml` : '—'}
              </span>
            </div>
            <Link href={`/admin/fragancias/${encodeURIComponent(f.id)}`} className={buttonClass('ghost', 'sm')} aria-label={`Editar ${f.name}`}>
              <Pencil className="size-3.5" />
            </Link>
            <button type="button" onClick={() => remove(f)} disabled={pending} className={buttonClass('danger', 'sm')} aria-label={`Eliminar ${f.name}`}>
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
        {list.length === 0 && <p className="p-6 text-center text-sm text-sand">Sin resultados</p>}
      </div>
    </>
  );
}
