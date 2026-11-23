import { formatDate, formatMoney } from '@/lib/utils/format';
import { whatsappLink } from '@/lib/utils/whatsapp';
import type { GuestBuyer } from '@/models/types';
import { buttonClass } from '@/views/shared/Button';

const SITE = 'https://jcfragances2026.vercel.app';

/** Persona que compró sin cuenta: datos de su última compra e invitación por WhatsApp. */
export function GuestBuyerCard({ guest: g }: { guest: GuestBuyer }) {
  const first = g.name.split(' ')[0];
  const register = `${SITE}/cuenta/registro?email=${encodeURIComponent(g.email)}&pedido=${encodeURIComponent(g.lastOrderNumber)}`;
  const message = g.hasAccount
    ? `Hola${first ? ` ${first}` : ''}, vi que ya tienes cuenta en JS FRAGANCES. Para ver el avance de tu pedido ${g.lastOrderNumber}, entra a ${SITE}/cuenta y en "¿Compraste antes sin cuenta?" escribe el número de pedido y tu correo.`
    : `Hola${first ? ` ${first}` : ''}, ahora puedes crear tu cuenta en JS FRAGANCES y ver en qué etapa va tu pedido ${g.lastOrderNumber} desde tu perfil. Es gratis y toma un minuto: ${register}`;

  return (
    <article className="space-y-3 rounded-3xl border border-cork bg-umber p-4 text-sm">
      <div>
        <p className="font-medium">{g.name || 'Sin nombre'}</p>
        <p className="break-all text-sand">{g.email}</p>
        {g.phone && <p className="text-sand">{g.phone}</p>}
      </div>
      {g.hasAccount && (
        <span className="inline-block rounded-pill border border-sky-400/70 px-2 py-0.5 text-[10px] uppercase text-sky-300">
          Ya tiene cuenta · falta agregar estos pedidos
        </span>
      )}
      <p className="text-[11px] text-drift">
        {g.ordersCount} {g.ordersCount === 1 ? 'pedido' : 'pedidos'} sin cuenta · {formatMoney(g.total)} · Último: {g.lastOrderNumber} ({formatDate(g.lastOrderAt)})
      </p>
      {g.phone ? (
        <a href={whatsappLink(g.phone, message)} target="_blank" rel="noopener noreferrer" className={buttonClass('whatsapp', 'sm')}>
          {g.hasAccount ? 'Recordarle por WhatsApp' : 'Invitar por WhatsApp'}
        </a>
      ) : (
        <p className="text-[11px] text-sand">Sin teléfono en sus pedidos.</p>
      )}
    </article>
  );
}
