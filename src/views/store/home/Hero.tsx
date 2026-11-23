import { SmartImage } from '@/views/shared/SmartImage';
import Link from 'next/link';
import { Check, MessageCircle } from 'lucide-react';
import { fragranceSlug } from '@/lib/utils/slug';
import { newestWithImage } from '@/models/domain/catalog';
import type { FragranceSummary, StoreConfig } from '@/models/types';
import { buttonClass } from '@/views/shared/Button';
import { adviceLink } from '../whatsapp-messages';
import styles from './Hero.module.css';

const STEPS = ['Elige tu perfume en el catálogo.', 'Escoge 3, 5 o 10 ml, o la botella completa.', 'Lo recibes en cualquier parte de México.'];
const MARQUEE = ['Decants originales', 'Envíos a todo México', 'Botellas de línea y tester', 'Atomizadores de vidrio', 'Bajo pedido'];

export function Hero({ config, fragrances }: { config: StoreConfig; fragrances: FragranceSummary[] }) {
  const newest = newestWithImage(fragrances, 5);
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-8 pt-10 sm:pt-16 lg:grid-cols-2">
        <div>
          <h1 className={styles.title}>
            Lleva el perfume que quieres, <span className={styles.accent}>en la medida que quieres.</span>
          </h1>
          <ul className="mt-6 space-y-2 text-sm text-sand">
            {STEPS.map((s) => (
              <li key={s} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-ember" /> {s}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="#catalogo" className={buttonClass('primary', 'lg')}>
              Ver catálogo
            </Link>
            <a href={adviceLink(config)} target="_blank" rel="noopener noreferrer" className={buttonClass('ghost', 'lg')}>
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          </div>
        </div>

        {newest.length > 0 && (
          <div className={`${styles.collage} grid grid-cols-5 items-end gap-2`} aria-label="Lo más nuevo">
            {newest.map((f, i) => (
              <Link key={f.id} href={`/perfume/${fragranceSlug(f)}`} className="relative block" style={{ height: `${150 + (i % 2) * 50}px` }}>
                <SmartImage src={f.image!} alt={`${f.brand} ${f.name}`} fill sizes="20vw" priority={i < 2} className="object-contain drop-shadow-xl" />
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className={`${styles.marquee} overflow-hidden py-3 text-[11px] font-medium uppercase tracking-[0.14em]`} aria-hidden="true">
        <div className={styles.track}>
          {[...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE].map((t, i) => (
            <span key={i} className={i % 2 ? 'px-6 opacity-55' : 'px-6'}>
              {t} ✦
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
