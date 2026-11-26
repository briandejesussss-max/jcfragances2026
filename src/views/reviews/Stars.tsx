import { Star } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/** Estrellas de solo lectura (admite medias estrellas visualmente redondeando al 0.5). */
export function Stars({ value, size = 'sm', className }: { value: number; size?: 'xs' | 'sm' | 'md'; className?: string }) {
  const px = { xs: 'size-3', sm: 'size-4', md: 'size-5' }[size];
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} role="img" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = rounded >= n ? 1 : rounded >= n - 0.5 ? 0.5 : 0;
        return (
          <span key={n} className="relative inline-block" aria-hidden="true">
            <Star className={cn(px, 'text-cork')} />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: fill === 1 ? '100%' : '50%' }}>
                <Star className={cn(px, 'fill-ember text-ember')} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
