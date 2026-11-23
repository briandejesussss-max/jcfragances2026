/** Esqueleto de carga: se muestra al instante mientras llegan los datos de la página. */
export function PageSkeleton({ cards = 4, label = 'Cargando…' }: { cards?: number; label?: string }) {
  return (
    <div className="animate-pulse space-y-5" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="h-8 w-48 rounded-xl bg-bark" />
      <div className="h-11 w-full rounded-xl bg-bark/70" />
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="h-36 rounded-3xl border border-cork bg-umber" />
        ))}
      </div>
    </div>
  );
}
