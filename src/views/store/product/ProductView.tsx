import { SmartImage } from '@/views/shared/SmartImage';
import Link from 'next/link';
import { ArrowLeft, Clock, Star, Wind } from 'lucide-react';
import { PLACEHOLDER_IMAGE } from '@/config/store';
import { profileOf } from '@/models/domain/profile';
import { summarizeReviews } from '@/models/domain/reviews';
import type { Fragrance, Review } from '@/models/types';
import { cn } from '@/lib/utils/cn';
import { CommunityProfile } from './CommunityProfile';
import { CustomerReviews } from './CustomerReviews';
import { NotesPyramid } from './NotesPyramid';
import { ProductSwipeNav } from './ProductNav';
import { ProductActions } from './ProductActions';
import { ProductPurchase } from './ProductPurchase';
import { ProductTabs } from './ProductTabs';
import styles from './ProductView.module.css';

const cssUrl = (u: string) => `url("${u.replace(/"/g, '%22').replace(/\)/g, '%29')}")`;

/** Ficha completa de un perfume (vista de servidor con partes interactivas). */
export function ProductView({ fragrance: f, reviews }: { fragrance: Fragrance; reviews: Review[] }) {
  const p = profileOf(f);
  const summary = summarizeReviews(reviews);
  const bg = (f.bgImage ?? '').trim();
  return (
    <article className="pb-16">
      <div className={cn(styles.stage, 'border-b border-dashed border-cork')}>
        {bg ? (
          <div className={styles.photo} style={{ backgroundImage: cssUrl(bg) }} aria-hidden="true" />
        ) : (
          f.image && <div className={styles.backdrop} style={{ backgroundImage: cssUrl(f.image) }} aria-hidden="true" />
        )}
        <div className="mx-auto max-w-5xl px-4 pb-8 pt-5">
          <div className="flex items-center justify-between gap-3">
            <Link href="/#catalogo" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-sand hover:text-cream">
              <ArrowLeft className="size-4" /> Catálogo
            </Link>
            <ProductActions fragrance={f} />
          </div>
          <div className="mt-4 grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div className="relative mx-auto h-72 w-full max-w-xs sm:h-96">
              <SmartImage src={f.image || PLACEHOLDER_IMAGE(f.name)} alt={`${f.brand} ${f.name}`} fill priority sizes="(max-width: 640px) 80vw, 40vw" className={cn(styles.bottle, 'object-contain')} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-ember">{f.brand}</p>
              <h1 className="mt-2 text-[clamp(2rem,7vw,3.4rem)]">{f.name}</h1>
              <div className="mt-5 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.06em]">
                <Chip>
                  <Clock className="size-3.5" /> {p.duracion}
                </Chip>
                <Chip>
                  <Wind className="size-3.5" /> Estela {p.estela}
                </Chip>
                {summary.count > 0 ? (
                  <a href="#resenas" className="inline-flex items-center gap-1.5 rounded-full border border-ember/60 bg-walnut/60 px-3 py-1.5 hover:border-ember">
                    <Star className="size-3.5 fill-ember text-ember" /> {summary.average.toFixed(1)} · {summary.count} {summary.count === 1 ? 'reseña' : 'reseñas'}
                  </a>
                ) : (
                  <Chip>
                    <Star className="size-3.5" /> {p.rating}
                  </Chip>
                )}
                <Chip>{f.concentration || 'EDP'}</Chip>
                {f.gender && <Chip>{f.gender}</Chip>}
              </div>
              <p className="mt-4 text-[11px] text-drift sm:hidden">← Desliza a los lados para ver otro perfume →</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 grid max-w-5xl gap-4 px-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <ProductTabs
            tabs={[
              { id: 'notas', label: 'Notas', content: <NotesPyramid fragrance={f} /> },
              { id: 'veredicto', label: 'Radiografía', content: <CommunityProfile fragrance={f} /> },
              { id: 'resenas', label: summary.count ? `Reseñas (${summary.count})` : 'Reseñas', content: <CustomerReviews fragranceId={f.id} reviews={reviews} /> },
            ]}
          />
        </div>
        <div className="order-first min-w-0 lg:sticky lg:top-20 lg:order-none lg:self-start">
          <ProductPurchase fragrance={f} />
        </div>
      </div>
      <ProductSwipeNav id={f.id} />
    </article>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-cork bg-walnut/60 px-3 py-1.5">{children}</span>;
}
