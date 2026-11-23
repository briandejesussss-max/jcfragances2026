import Link from 'next/link';
import { centsToMoney, inMonth, MONTHS, shiftMonth, totals, cents } from '@/models/domain/finance';
import type { AppSettings, Movement, Order } from '@/models/types';
import { financeHref } from './FinanceNav';
import styles from './FinanceChart.module.css';
import { cn } from '@/lib/utils/cn';

interface Props {
  month: string;
  movements: Movement[];
  orders: Pick<Order, 'status' | 'total'>[];
  settings: AppSettings;
}

/** Resumen del mes: ingresos, gastos, beneficio, reserva de impuestos y pedidos por cobrar. */
export function FinanceDashboard({ month, movements, orders, settings }: Props) {
  const k = totals(inMonth(movements, month), settings.taxReservePct, settings.taxBase);
  const prev = totals(inMonth(movements, shiftMonth(month, -1)), settings.taxReservePct, settings.taxBase);
  const months = [-5, -4, -3, -2, -1, 0].map((d) => shiftMonth(month, d));
  const series = months.map((m) => ({ m, ...totals(inMonth(movements, m)) }));
  const max = Math.max(1, ...series.map((d) => Math.max(d.income, d.expenses)));
  const pending = orders.filter((o) => o.status === 'pendiente_pago');
  const onRoad = orders.filter((o) => ['proveedor', 'transito'].includes(o.status));
  const pendingSum = pending.reduce((a, o) => a + cents(o.total), 0);

  const delta = (a: number, b: number) =>
    b === 0 ? null : (
      <small className="block text-[11px] text-sand">
        {a - b >= 0 ? '▲' : '▼'} {centsToMoney(Math.abs(a - b))} vs mes anterior
      </small>
    );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card href={financeHref('mov', month, 'ingreso')} label="Ingresos" value={centsToMoney(k.income)} tone="text-ok" extra={delta(k.income, prev.income)} />
        <Card href={financeHref('mov', month, 'gasto')} label="Gastos" value={centsToMoney(k.expenses)} tone="text-bad" extra={delta(k.expenses, prev.expenses)} />
        <Card label="Beneficio del mes" value={centsToMoney(k.balance)} tone={k.balance >= 0 ? 'text-ok' : 'text-bad'} extra={delta(k.balance, prev.balance)} />
        <Card
          href={financeHref('cfg', month)}
          label={`Reservar para impuestos (${settings.taxReservePct}% de ${settings.taxBase})`}
          value={centsToMoney(k.reserve)}
          extra={settings.taxReservePct > 0 ? null : <small className="block text-[11px] text-sand">Define tu porcentaje en Configuración</small>}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card href="/admin/pedidos" label="Pedidos por cobrar" value={String(pending.length)} extra={<small className="text-sand">{centsToMoney(pendingSum)}</small>} />
        <Card href="/admin/pedidos" label="Bajo pedido en camino" value={String(onRoad.length)} />
      </div>
      <div className="rounded-3xl border border-cork bg-umber p-4">
        <small className="text-sand">
          Ingresos <span className="text-ok">■</span> y gastos <span className="text-bad">■</span>, últimos 6 meses
        </small>
        <div className={styles.chart}>
          {series.map((d) => (
            <div key={d.m} className={styles.col}>
              <div className={styles.pair}>
                <i className={cn(styles.bar, styles.income)} style={{ height: `${(d.income / max) * 100}%` }} title={centsToMoney(d.income)} />
                <i className={cn(styles.bar, styles.expense)} style={{ height: `${(d.expenses / max) * 100}%` }} title={centsToMoney(d.expenses)} />
              </div>
              <small className="text-[11px] text-sand">{MONTHS[Number(d.m.slice(5)) - 1].slice(0, 3)}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, tone, extra, href }: { label: string; value: string; tone?: string; extra?: React.ReactNode; href?: string }) {
  const body = (
    <>
      <small className="block text-[11px] text-sand">{label}</small>
      <strong className={cn('mt-1 block text-2xl font-medium', tone)}>{value}</strong>
      {extra}
    </>
  );
  const cls = 'block rounded-3xl border border-cork bg-umber p-4';
  return href ? (
    <Link href={href} className={cn(cls, 'transition hover:border-sand')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
