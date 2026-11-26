import type { InstagramPhoto } from '@/models/types';
import { SmartImage } from '@/views/shared/SmartImage';
import styles from './HomeSections.module.css';

/** Ícono tipo Instagram (cámara redondeada). */
function IgIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

/** "Síguenos en Instagram": fotos que se suben en Panel → Tienda → Portada. */
export function InstagramGallery({ photos, handle, url }: { photos: InstagramPhoto[]; handle: string; url: string }) {
  if (!photos.length) return null;
  const user = handle.replace(/^@/, '') || 'instagram';
  const profile = url || `https://www.instagram.com/${user}`;
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-center gap-3">
        <span className={styles.igRing}>
          <span>
            <IgIcon className="size-5 text-cream" />
          </span>
        </span>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-ember">Síguenos en Instagram</p>
          <p className="text-2xl font-extrabold">@{user}</p>
        </div>
      </div>
      <p className="mt-2 text-sm text-sand">Novedades, pedidos que van saliendo y recomendaciones de la semana.</p>
      <div className="mt-4 grid grid-cols-3 gap-1 overflow-hidden rounded-2xl">
        {photos.map((p, i) => (
          <a key={`${p.image}-${i}`} href={p.link || profile} target="_blank" rel="noopener noreferrer" className="group relative aspect-square overflow-hidden bg-bark" aria-label={`Ver en Instagram (foto ${i + 1})`}>
            <SmartImage src={p.image} alt="" fill sizes="(max-width: 768px) 33vw, 250px" className="object-cover transition duration-500 group-hover:scale-105" />
            <IgIcon className="absolute right-1.5 top-1.5 size-3.5 text-white drop-shadow" />
          </a>
        ))}
      </div>
      <a href={profile} target="_blank" rel="noopener noreferrer" className="btn-primary mt-4 flex items-center justify-center gap-2 rounded-pill bg-bark px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.06em] text-cream">
        <IgIcon className="size-4" /> Seguir en Instagram
      </a>
    </section>
  );
}
