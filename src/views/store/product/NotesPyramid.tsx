import { compactNotes, composePyramid, guessImage, PYRAMID_DEFAULT_EMOJI, PYRAMID_SECTION_LABEL, PYRAMID_SECTIONS, pyramidFor } from '@/models/domain/pyramid';
import { CompactNotesText } from './CompactNotesText';
import type { Fragrance } from '@/models/types';
import styles from './ProductView.module.css';

/** Pirámide olfativa con foto por nota (si la foto no existe, queda el emoji). */
export function NotesPyramid({ fragrance: f }: { fragrance: Fragrance }) {
  const pyramid = pyramidFor(f)!;
  const composed = composePyramid(f.pyramid);
  const freeText = composed && f.notes === composed ? '' : f.notes || 'Composición olfativa con notas nobles y secado elegante.';

  return (
    <section className="min-w-0 rounded-3xl border border-cork bg-umber p-4 sm:p-5">
      <h2 className="text-[11px] tracking-[0.14em] text-sand">Pirámide olfativa detallada</h2>
      <div className="mt-4 space-y-4">
        {PYRAMID_SECTIONS.map((s) => (
          <div key={s}>
            <span className="text-[10px] uppercase tracking-[0.1em] text-ember">{PYRAMID_SECTION_LABEL[s]}</span>
            {/* Celular: una fila que se desliza; desde tableta: se acomodan en varias filas */}
            <div className="-mx-1 mt-2 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
              {pyramid[s].length === 0 && <span className="text-xs text-drift">—</span>}
              {pyramid[s].map((n, i) => {
                const img = n.img || guessImage(n.t);
                return (
                  <div key={`${n.t}-${i}`} className={`${styles.note} shrink-0 snap-start`} title={n.t}>
                    <span className={styles.noteFallback}>{n.e || PYRAMID_DEFAULT_EMOJI[s]}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element -- fotos de notas pueden ser data URI o externas */}
                    {img && <img src={img} alt={n.t} loading="lazy" />}
                    <span className={styles.noteLabel}>{n.t}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {freeText && (
        <div className="mt-4">
          {/* Celular: compacto con comas; computadora: el texto tal como se escribió */}
          <div className="sm:hidden">
            <CompactNotesText sections={compactNotes(freeText)} />
          </div>
          <p className="hidden whitespace-pre-line text-sm leading-relaxed text-sand sm:block">{freeText}</p>
        </div>
      )}
    </section>
  );
}
