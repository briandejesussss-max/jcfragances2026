'use client';

import { SmartImage } from '@/views/shared/SmartImage';
import Link from 'next/link';
import { Heart, Sparkles } from 'lucide-react';
import { PLACEHOLDER_IMAGE } from '@/config/store';
import { cn } from '@/lib/utils/cn';
import { fragranceSlug } from '@/lib/utils/slug';
import { profileOf } from '@/models/domain/profile';
import type { FragranceSummary } from '@/models/types';
import { useStore } from '../state/StoreProvider';
import { SizeButtons } from './SizeButtons';
import styles from './FragranceCard.module.css';

export function FragranceCard({ fragrance: f, priority = false }: { fragrance: FragranceSummary; priority?: boolean }) {
  const { shelf, toggleShelf, reviewStats } = useStore();
  const stat = reviewStats[f.id];
  const inShelf = shelf.includes(f.id);
  const href = `/perfume/${fragranceSlug(f)}`;

  return (
    <article className={cn(styles.card, 'flex flex-col justify-between overflow-hidden rounded-[20px] border border-cork bg-umber')}>
      <div>
        <Link href={href} className={cn(styles.stage, 'relative block h-48 border-b border-dashed border-cork sm:h-52')}>
          <SmartImage
            src={f.image || PLACEHOLDER_IMAGE(f.name)}
            alt={`${f.brand} ${f.name}`}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={cn(styles.bottle, 'object-contain p-4')}
          />
          <span className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
            {f.comingSoon && <Badge strong>⏳ Próximamente</Badge>}
            <Badge>{f.concentration || 'EDP'}</Badge>
            {f.gender && <Badge>{f.gender}</Badge>}
          </span>
        </Link>
        <button
          type="button"
          onClick={() => toggleShelf(f.id)}
          aria-label={inShelf ? 'Quitar de mi armario' : 'Guardar en mi armario'}
          aria-pressed={inShelf}
          className="absolute right-2.5 top-2.5 rounded-full bg-walnut/70 p-1.5 text-sand transition hover:text-ember"
        >
          <Heart className={cn('size-4', inShelf && 'fill-ember text-ember')} />
        </button>

        <Link href={href} className="block p-3 pb-2 sm:p-4 sm:pb-2">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.08em]">
            <span className="truncate text-cream">{f.brand}</span>
            {stat ? (
              <span className="shrink-0 font-mono text-ember" title={`${stat.reviews} ${stat.reviews === 1 ? 'reseña' : 'reseñas'} de clientes`}>
                ★ {stat.average.toFixed(1)} <span className="text-sand">({stat.reviews})</span>
              </span>
            ) : (
              <span className="shrink-0 font-mono text-sand">★ {profileOf(f).rating}</span>
            )}
          </div>
          <h3 className={cn(styles.name, 'mt-1 truncate text-base sm:text-lg')}>{f.name}</h3>
          {f.inspiration?.name && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-ember">
              <Sparkles className="size-3 shrink-0" /> <span className="truncate">Inspirado en {f.inspiration.name}</span>
            </p>
          )}
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-sand">
            <span className="text-drift">Notas:</span> {f.notes || 'Toca para abrir la pirámide y radiografía olfativa.'}
          </p>
        </Link>
      </div>
      <div className="p-3 pt-1 sm:p-4 sm:pt-1">
        <SizeButtons fragrance={f} />
      </div>
    </article>
  );
}

function Badge({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.06em]',
        strong ? 'bg-cream text-walnut' : 'border border-cork bg-walnut/70 text-sand',
      )}
    >
      {children}
    </span>
  );
}
