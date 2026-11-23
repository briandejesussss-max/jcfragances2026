import { cn } from '@/lib/utils/cn';
import type { Order } from '@/models/types';
import { orderSteps } from './order-progress';

/** Barra de avance compacta para la lista de pedidos. */
export function OrderProgress({ order }: { order: Order }) {
  const steps = orderSteps(order);
  const current = steps.findIndex((s) => s.state === 'current');
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1" role="img" aria-label={`Etapa ${current + 1} de ${steps.length}: ${steps[current]?.label ?? ''}`}>
        {steps.map((s) => (
          <span key={s.status} className={cn('h-1.5 flex-1 rounded-full', s.state === 'todo' ? 'bg-cork' : 'bg-ember')} />
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-sand">
        <span>{steps[0].label}</span>
        <span className="text-cream">{steps[current]?.label}</span>
        <span>{steps[steps.length - 1].label}</span>
      </div>
    </div>
  );
}
