'use client';

import Link from 'next/link';
import { Copy } from 'lucide-react';
import { BANK, SHIPPING } from '@/config/store';
import type { PlacedOrder } from '@/controllers/checkout.controller';
import { formatClabe } from '@/lib/utils/format';
import { whatsappLink } from '@/lib/utils/whatsapp';
import { buttonClass } from '@/views/shared/Button';
import { Modal } from '@/views/shared/Modal';
import { useToast } from '@/views/shared/Toast';
import { useStore } from '../state/StoreProvider';

/** Instrucciones de pago por transferencia después de registrar el pedido. */
export function PaymentModal({ order, onClose }: { order: (PlacedOrder & { email?: string }) | null; onClose: () => void }) {
  const { config, price } = useStore();
  const notify = useToast();
  if (!order) return null;

  const onDemand = order.items.filter((i) => i.onDemand);
  const eta = onDemand.find((i) => i.eta)?.eta;
  const msg = `Hola, ya hice mi transferencia del pedido ${order.number} por ${price(order.total)}. Te envío mi comprobante.`;

  return (
    <Modal open onClose={onClose} title="¡Pedido registrado!" size="sm">
      <div className="space-y-3 text-sm">
        <p>
          Tu número de pedido es <b className="text-ember">{order.number}</b>. Guárdalo para rastrearlo.
        </p>
        {onDemand.length > 0 && (
          <p className="text-xs text-sand">
            📦 Tu pedido incluye productos bajo pedido{eta ? ` (tiempo estimado: ${eta})` : ''}. Te avisamos cada etapa y puedes rastrearlo cuando quieras.
          </p>
        )}
        <div className="space-y-1 rounded-2xl border border-cork bg-bark/50 p-3 text-xs">
          <p className="text-[10px] uppercase tracking-[0.1em] text-sand">Transferencia</p>
          <p>
            Productos: {price(order.subtotal)} · Envío: {price(order.shipping)}
          </p>
          <p>
            Monto a transferir: <b>{price(order.total)}</b>
          </p>
          <p className="flex flex-wrap items-center gap-2">
            CLABE: <b className="font-mono">{formatClabe(BANK.clabe)}</b>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(BANK.clabe).then(() => notify('CLABE copiada'))}
              className="inline-flex items-center gap-1 underline"
            >
              <Copy className="size-3" /> Copiar
            </button>
          </p>
          <p>
            Titular: <b>{BANK.holder}</b> · Banco: <b>{BANK.bank}</b>
          </p>
          <p>
            Concepto: <b>{order.number}</b>
          </p>
        </div>
        <p className="text-xs text-sand">
          El envío general es de {price(SHIPPING.base)}. Si tu código postal es zona extendida, el costo cambia según la paquetería y te escribimos por WhatsApp
          con el monto final: espera ese mensaje antes de transferir. Cuando pagues, avísanos y confirmamos tu pago. Después te mandamos tu guía de envío.
        </p>
        <a href={whatsappLink(config.whatsapp, msg)} target="_blank" rel="noopener noreferrer" className={buttonClass('whatsapp', 'lg', 'w-full')}>
          Enviar comprobante por WhatsApp
        </a>
        {order.linkedToAccount ? (
          <Link href={`/cuenta/pedidos/${encodeURIComponent(order.number)}`} className={buttonClass('ghost', 'md', 'w-full')} onClick={onClose}>
            Ver el avance en mi cuenta
          </Link>
        ) : (
          <div className="space-y-2 rounded-2xl border border-dashed border-cork p-3 text-xs text-sand">
            <p>¿Quieres seguir tu pedido desde tu perfil?</p>
            <Link href={`/cuenta/registro?pedido=${encodeURIComponent(order.number)}${order.email ? `&email=${encodeURIComponent(order.email)}` : ''}`} className={buttonClass('ghost', 'sm', 'w-full')} onClick={onClose}>
              Crea tu cuenta
            </Link>
          </div>
        )}
      </div>
    </Modal>
  );
}
