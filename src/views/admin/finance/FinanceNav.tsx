import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { monthLabel, shiftMonth } from '@/models/domain/finance';
import { cn } from '@/lib/utils/cn';

export type FinanceTab = 'dash' | 'mov' | 'cfg';

const TABS: Array<[FinanceTab, string]> = [
  ['dash', 'Dashboard'],
  ['mov', 'Movimientos'],
  ['cfg', 'Configuración'],
];

const href = (tab: FinanceTab, month: string, type?: string) => `/admin/finanzas?tab=${tab}&mes=${month}${type ? `&tipo=${type}` : ''}`;

export function FinanceTabs({ tab, month }: { tab: FinanceTab; month: string }) {
  return (
    <div className="flex gap-1">
      {TABS.map(([k, label]) => (
        <Link key={k} href={href(k, month)} className={cn('rounded-pill border px-3 py-1.5 text-[11px] uppercase', tab === k ? 'border-cream bg-cream text-walnut' : 'border-cork text-sand')}>
          {label}
        </Link>
      ))}
    </div>
  );
}

export function MonthNav({ tab, month, type }: { tab: FinanceTab; month: string; type?: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <Link href={href(tab, shiftMonth(month, -1), type)} aria-label="Mes anterior" className="rounded-full border border-cork p-1.5 hover:bg-bark">
        <ChevronLeft className="size-4" />
      </Link>
      <b className="min-w-36 text-center text-sm font-medium capitalize">{monthLabel(month)}</b>
      <Link href={href(tab, shiftMonth(month, 1), type)} aria-label="Mes siguiente" className="rounded-full border border-cork p-1.5 hover:bg-bark">
        <ChevronRight className="size-4" />
      </Link>
    </div>
  );
}

export const financeHref = href;
