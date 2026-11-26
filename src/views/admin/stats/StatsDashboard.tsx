import Link from 'next/link';
import { formatMoney } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { AdminStats } from '@/models/types';
import { PageTitle } from '../shared/PageTitle';
import { DailyChart } from './DailyChart';
import { OptOutToggle } from './OptOutToggle';

const RANGES = [7, 30, 90];

const SOURCE_LABEL: Record<string, string> = {
  directo: 'Directo / enlace guardado',
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
  google: 'Google',
  buscador: 'Otros buscadores',
  x: 'X (Twitter)',
};

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

/** Panel → Estadísticas: qué se ve, qué se agrega a la bolsa, qué se vende y de dónde llegan. */
export function StatsDashboard({ stats: s }: { stats: AdminStats }) {
  const t = s.totals;
  const f = s.funnel;
  const conversion = pct(f.ordered, f.visitors);
  const funnel = [
    { label: 'Visitaron la tienda', n: f.visitors },
    { label: 'Abrieron un perfume', n: f.viewed_product },
    { label: 'Agregaron a la bolsa', n: f.added_to_cart },
    { label: 'Llenaron sus datos', n: f.started_checkout },
    { label: 'Hicieron pedido', n: f.ordered },
  ];
  const top = s.fragrances.filter((x) => x.views > 0 || x.sold > 0 || x.adds > 0).slice(0, 12);
  const maxSource = Math.max(1, ...s.sources.map((x) => x.visitors));
  const empty = t.visitors === 0 && t.orders === 0;

  return (
    <>
      <PageTitle title="Estadísticas">
        <div className="flex gap-1" role="tablist" aria-label="Periodo">
          {RANGES.map((d) => (
            <Link
              key={d}
              href={`/admin/estadisticas?dias=${d}`}
              role="tab"
              aria-selected={s.days === d}
              className={cn('rounded-pill border px-3 py-1.5 text-[11px] uppercase', s.days === d ? 'border-cream bg-cream text-walnut' : 'border-cork text-sand hover:text-cream')}
            >
              {d} días
            </Link>
          ))}
        </div>
      </PageTitle>

      {empty && (
        <p className="mb-4 rounded-2xl border border-cork bg-umber p-4 text-sm text-sand">
          Aún no hay visitas registradas en este periodo. Las estadísticas empiezan a contarse desde que se publicó esta función; vuelve en unos días.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Visitantes" value={t.visitors} hint={`${t.page_views} páginas vistas`} />
        <Kpi label="Perfumes abiertos" value={t.product_views} hint={`${t.add_to_cart} agregados a la bolsa`} />
        <Kpi label="Pedidos" value={t.orders} hint={`${conversion}% de visitantes compró`} />
        <Kpi label="Clics a WhatsApp" value={t.whatsapp_clicks} hint={`Ventas pagadas: ${formatMoney(t.revenue)}`} />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card title="Visitantes por día">
          <DailyChart daily={s.daily} />
        </Card>

        <Card title="Embudo de compra">
          <ol className="space-y-2">
            {funnel.map((step, i) => (
              <li key={step.label}>
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span>{step.label}</span>
                  <span className="font-mono text-sand">
                    {step.n}
                    {i > 0 && <span className="ml-1 text-drift">({pct(step.n, funnel[i - 1].n)}%)</span>}
                  </span>
                </div>
                <span className="mt-1 block h-2 overflow-hidden rounded-full bg-bark">
                  <span className="block h-full rounded-full bg-ember" style={{ width: `${pct(step.n, f.visitors)}%` }} />
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[11px] text-drift">El porcentaje entre paréntesis compara con el paso anterior: muestra dónde se van las personas.</p>
        </Card>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card title="Perfumes: qué se ve y qué se vende">
          {top.length === 0 ? (
            <p className="text-sm text-sand">Sin datos todavía.</p>
          ) : (
            <div className="-mx-1 overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-xs">
                <thead className="text-[10px] uppercase tracking-[0.06em] text-sand">
                  <tr>
                    <th className="px-1 py-1.5 font-medium">Perfume</th>
                    <th className="px-1 py-1.5 text-right font-medium" title="Personas distintas que abrieron la ficha">Lo vieron</th>
                    <th className="px-1 py-1.5 text-right font-medium">A la bolsa</th>
                    <th className="px-1 py-1.5 text-right font-medium">Vendidos</th>
                  </tr>
                </thead>
                <tbody>
                  {top.map((x) => (
                    <tr key={x.id} className="border-t border-dashed border-cork">
                      <td className="px-1 py-1.5">
                        <span className="block text-[10px] uppercase text-sand">{x.brand}</span>
                        {x.name}
                      </td>
                      <td className="px-1 py-1.5 text-right font-mono">{x.viewers}</td>
                      <td className="px-1 py-1.5 text-right font-mono">{x.adds}</td>
                      <td className="px-1 py-1.5 text-right font-mono">{x.sold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-[11px] text-drift">Si un perfume se ve mucho pero se vende poco, revisa su precio, fotos o descripción.</p>
        </Card>

        <Card title="¿De dónde llegan?">
          {s.sources.length === 0 ? (
            <p className="text-sm text-sand">Sin datos todavía.</p>
          ) : (
            <ul className="space-y-2">
              {s.sources.slice(0, 8).map((x) => (
                <li key={x.source}>
                  <div className="flex justify-between gap-2 text-xs">
                    <span className="truncate">{SOURCE_LABEL[x.source] ?? x.source}</span>
                    <span className="font-mono text-sand">{x.visitors}</span>
                  </div>
                  <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-bark">
                    <span className="block h-full rounded-full bg-ember" style={{ width: `${(x.visitors / maxSource) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-drift">
            Tip: al compartir el link en Instagram agrega <code className="text-sand">?utm_source=instagram</code> al final para saber exactamente cuántos llegan de ahí.
          </p>
        </Card>
      </div>

      <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-cork bg-umber p-4 text-xs text-sand sm:flex-row sm:items-center sm:justify-between">
        <p>Las estadísticas son anónimas: no se guarda nombre, correo ni IP de los visitantes.</p>
        <OptOutToggle />
      </div>
    </>
  );
}

function Kpi({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-2xl border border-cork bg-umber p-4">
      <span className="block text-[10px] uppercase tracking-[0.08em] text-sand">{label}</span>
      <strong className="mt-1 block font-mono text-2xl font-medium">{value.toLocaleString('es-MX')}</strong>
      <span className="mt-1 block text-[11px] text-drift">{hint}</span>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-3xl border border-cork bg-umber p-4">
      <h2 className="mb-3 text-[11px] uppercase tracking-[0.12em] text-sand">{title}</h2>
      {children}
    </section>
  );
}
