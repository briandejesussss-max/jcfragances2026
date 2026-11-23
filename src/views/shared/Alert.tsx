import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export function Alert({ tone = 'warn', children, className }: { tone?: 'warn' | 'ok' | 'info'; children: ReactNode; className?: string }) {
  const tones = {
    warn: 'border-bad/40 bg-bad/10 text-bad',
    ok: 'border-ok/40 bg-ok/10 text-ok',
    info: 'border-cork bg-bark/60 text-sand',
  };
  return <div className={cn('rounded-xl border px-3 py-2 text-xs', tones[tone], className)}>{children}</div>;
}
