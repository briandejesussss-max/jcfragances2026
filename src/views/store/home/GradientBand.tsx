import styles from './HomeSections.module.css';

const ITEMS = [
  'Decants originales',
  'Envíos a todo México',
  'Atomizadores de vidrio',
  'Perfumes árabes y de autor',
];

/** Franja inclinada con degradado y texto que corre. */
export function GradientBand() {
  return (
    <div className={styles.bandWrap} aria-hidden='true'>
      <div className={styles.band}>
        <div className={styles.bandTrack}>
          {[...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS].map((t, i) => (
            <span key={i} className='px-5'>
              {t.toUpperCase()} ✦
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
