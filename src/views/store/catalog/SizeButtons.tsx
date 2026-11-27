'use client';

import { formatMl } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import {
  BOTTLE,
  hasBottleStock,
  hasMlStock,
  presentationLabel,
  reservedFor,
  sellableKeys,
  sizeInfo,
  sizeState,
  stockNotices,
} from '@/models/domain/sizes';
import type { Fragrance, FragranceSummary } from '@/models/types';
import { useStore } from '../state/StoreProvider';
import { bottleOnDemandLink, comingSoonLink, sizeOnDemandLink } from '../whatsapp-messages';

interface Props {
  fragrance: FragranceSummary | Fragrance;
  /** Ficha completa: botones más grandes */
  large?: boolean;
  /** Muestra existencias (solo con sesión del propietario) */
  showStock?: boolean;
}

/** Botones de presentaciones con su precio y disponibilidad (descuenta lo que ya está en la bolsa). */
export function SizeButtons({ fragrance: f, large = false, showStock = false }: Props) {
  const { sizes, cart, config, price, addToCart } = useStore();

  if (f.comingSoon) {
    return (
      <div className="space-y-2 rounded-2xl border border-cork bg-bark/50 p-3 text-center">
        <span className="block text-[11px] font-medium uppercase tracking-[0.08em] text-cream">⏳ Próximamente en catálogo</span>
        <p className="text-[11px] text-sand">Aún en camino. Aparta tu aviso para ser de los primeros.</p>
        <a
          href={comingSoonLink(config, f)}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-pill bg-cream px-3 py-2 text-[11px] font-medium uppercase tracking-[0.06em] text-walnut"
        >
          📲 Avísame cuando llegue
        </a>
      </div>
    );
  }

  const reserved = reservedFor(cart, f as Fragrance, sizes);
  const notices = stockNotices(f as Fragrance, sizes, config.lowMlThreshold, reserved);

  const buttons = sellableKeys(sizes).map((key) => {
    const st = sizeState(f as Fragrance, key, sizes, reserved);
    const isPartial = key !== BOTTLE && sizeInfo(sizes, key).kind === 'parcial';
    if (st.hidden || (isPartial && !st.ok)) return null;
    const label = presentationLabel(sizes, f as Fragrance, key, large);
    const base = cn(
      'flex flex-col items-center justify-center rounded-xl border text-center transition',
      large ? 'gap-1 p-2.5' : 'gap-0.5 p-1.5',
    );
    const labelCls = cn('uppercase tracking-[0.06em]', large ? 'text-[11px]' : 'text-[11px]');
    const priceCls = cn('font-medium', large ? 'text-sm' : 'text-xs');

    if (st.onDemand) {
      const bottleNoDb = key === BOTTLE && st.noPrice;
      const href = st.noPrice ? (key === BOTTLE ? bottleOnDemandLink(config, f, '') : sizeOnDemandLink(config, sizes, f, key)) : null;
      const content = (
        <>
          <span className={labelCls}>{label}</span>
          <span className={priceCls}>{st.noPrice ? 'Cotizar' : price(st.price)}</span>
          {/* En la tarjeta chica solo "Bajo pedido"; el tiempo de llegada se ve en la ficha */}
          <span className="text-[11px] leading-tight text-sand">Bajo pedido{large && st.eta ? ` · ${st.eta}` : ''}</span>
        </>
      );
      return href ? (
        <a key={key} href={href} target="_blank" rel="noopener noreferrer" className={cn(base, 'border-ember/70 bg-ember/10 hover:bg-ember/20')} title={bottleNoDb ? 'Encargo por WhatsApp' : 'Cotizar por WhatsApp'}>
          {content}
        </a>
      ) : (
        <button key={key} type="button" onClick={() => addToCart(f.id, key)} className={cn(base, 'border-ember/70 bg-ember/10 hover:bg-ember/20')}>
          {content}
        </button>
      );
    }

    return (
      <button
        key={key}
        type="button"
        disabled={!st.ok}
        title={st.ok ? undefined : st.reason}
        onClick={() => addToCart(f.id, key)}
        className={cn(base, st.ok ? 'border-cork bg-walnut/60 hover:border-sand' : 'cursor-not-allowed border-cork/50 opacity-35')}
      >
        <span className={cn(labelCls, 'text-sand')}>{label}</span>
        <span className={priceCls}>{st.ok ? price(st.price) : st.unavailableLabel}</span>
      </button>
    );
  });

  return (
    <div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${large ? 84 : 62}px, 1fr))` }}>
        {buttons}
      </div>
      {notices.map((n) => (
        <p key={n} className="mt-2 rounded-lg border border-bad/30 bg-bad/10 px-2 py-1 text-[11px] text-bad">
          {n}
        </p>
      ))}
      {showStock && (
        <p className="mt-1.5 font-mono text-[11px] text-drift">
          📦 Piezas: {hasBottleStock(f as Fragrance) ? f.stock?.bottles : '—'} • 💧 {hasMlStock(f as Fragrance) ? `${formatMl(f.stock?.ml ?? 0)} ml` : '—'}
        </p>
      )}
    </div>
  );
}
