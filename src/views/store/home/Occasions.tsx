import Link from 'next/link';
import { fragranceSlug } from '@/lib/utils/slug';
import type { FragranceSummary } from '@/models/types';
import { SmartImage } from '@/views/shared/SmartImage';
import styles from './HomeSections.module.css';

/** "Un perfume para cada momento": tarjetas que se deslizan de lado. */
export function Occasions({ items }: { items: Array<{ title: string; fragrance: FragranceSummary }> }) {
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-6xl py-8">
      <div className="px-4">
        <p className="text-[11px] uppercase tracking-[0.2em] text-ember">Del frasco a tu piel</p>
        <h2 className="mt-2 text-[clamp(2rem,9vw,3.2rem)] leading-none">
          Un perfume para <span className="text-aurora text-ember">cada momento.</span>
        </h2>
      </div>
      <div className="flex snap-x gap-3 overflow-x-auto px-4 pb-2 pt-5 [scrollbar-width:none] lg:grid lg:grid-cols-4 lg:overflow-visible">
        {items.map(({ title, fragrance: f }, i) => (
          <Link key={title} href={`/perfume/${fragranceSlug(f)}`} className={styles.occasion} data-tone={i % 4}>
            <span className="absolute inset-x-0 top-5 mx-auto h-40 w-full">
              <SmartImage src={f.image!} alt={`${f.brand} ${f.name}`} fill sizes="240px" className="object-contain drop-shadow-2xl" />
            </span>
            <span className="absolute inset-x-4 bottom-4">
              <strong className="block text-xl font-extrabold">{title}</strong>
              <span className="block truncate text-xs text-sand">
                {f.brand} {f.name} →
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
