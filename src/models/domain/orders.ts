import { BANK, ORDER_STATUS_LABEL, SHIPPING } from '@/config/store';
import { formatMoney } from '@/lib/utils/format';
import type { CartLine, Customer, Fragrance, Order, OrderItem, OrderStatus, SizeConfig } from '../types';
import { BOTTLE, bottlePrice, isOnDemand, mlOf, partialLabel, sizeInfo, sizePrice, sizeState } from './sizes';

/** Reglas de pedidos: armado, validación, envío, etapas y mensajes al cliente. */

export const CUSTOMER_REQUIRED: Array<keyof Customer> = ['name', 'phone', 'email', 'street', 'numExt', 'cp', 'colonia', 'city', 'state'];

export function validateCustomer(c: Customer): string | null {
  for (const k of CUSTOMER_REQUIRED) if (!String(c[k] ?? '').trim()) return k === 'email' ? 'Escribe tu correo para darte seguimiento' : 'Completa tus datos de entrega';
  if (!/^\S+@\S+\.\S+$/.test(c.email)) return 'Escribe un correo válido para darte seguimiento';
  if (!/^\d{5}$/.test(c.cp)) return 'El código postal debe tener 5 dígitos';
  if (String(c.phone).replace(/\D/g, '').length < 10) return 'Escribe un teléfono de 10 dígitos';
  return null;
}

export const shippingFor = (cp: string) =>
  SHIPPING.base + ((SHIPPING.extendedZipCodes as readonly string[]).includes(cp) ? SHIPPING.extra : 0);

/**
 * Convierte el carrito en renglones de pedido usando los precios ACTUALES de la base de datos.
 * Nunca confía en precios enviados por el navegador.
 */
export function buildOrderItems(lines: CartLine[], byId: Map<string, Fragrance>, sizes: SizeConfig[]): { items: OrderItem[]; errors: string[] } {
  const items: OrderItem[] = [];
  const errors: string[] = [];
  for (const l of lines) {
    const f = byId.get(l.fragId);
    const qty = Math.floor(Number(l.qty));
    if (!f || !(qty > 0) || qty > 50) {
      errors.push('Una fragancia de tu bolsa ya no está disponible');
      continue;
    }
    const st = sizeState(f, l.size, sizes);
    if (!st.ok) {
      errors.push(`${f.brand} ${f.name}: ${st.reason ?? 'ya no disponible'}`);
      continue;
    }
    if (st.noPrice) {
      errors.push(`${f.brand} ${f.name}: esta presentación se cotiza por WhatsApp`);
      continue;
    }
    const onDemand = isOnDemand(f, l.size);
    const eta = (l.size === BOTTLE ? bottlePrice(f)?.eta : onDemand ? sizePrice(f, l.size)?.eta : '') ?? '';
    items.push({
      fragId: f.id,
      brand: f.brand,
      name: f.name,
      size: l.size,
      label: l.size === BOTTLE ? 'Botella' : partialLabel(sizes, f, l.size),
      ml: l.size === BOTTLE ? 0 : mlOf(sizes, l.size),
      kind: l.size === BOTTLE ? 'bottle' : (sizeInfo(sizes, l.size).kind as OrderItem['kind']),
      qty,
      price: st.price,
      onDemand,
      eta,
    });
  }
  return { items, errors };
}

export const itemsSubtotal = (items: Pick<OrderItem, 'price' | 'qty'>[]) =>
  items.reduce((a, i) => a + Number(i.price) * Number(i.qty), 0);

export const itemText = (i: OrderItem) =>
  `${i.qty}x ${i.brand} - ${i.name} (${i.size === BOTTLE ? 'Botella' : i.label || i.size})` +
  (i.onDemand ? ` 📦 Bajo pedido${i.eta ? ` (~${i.eta})` : ''}` : '');

export const hasOnDemand = (items: OrderItem[]) => items.some((i) => i.onDemand);

/** Etapas visibles para el cliente (los pedidos bajo pedido tienen pasos de importación). */
export const trackingSteps = (items: OrderItem[]): OrderStatus[] =>
  hasOnDemand(items)
    ? ['pendiente_pago', 'pagado', 'proveedor', 'transito', 'recibido', 'enviado', 'entregado']
    : ['pendiente_pago', 'pagado', 'enviado', 'entregado'];

export const statusLabel = (s: OrderStatus) => ORDER_STATUS_LABEL[s] ?? s;

/** Siguiente acción posible del panel según el estado actual. */
export function nextActions(o: Pick<Order, 'status' | 'items'>): Array<{ status: OrderStatus; label: string; needsShipping?: boolean }> {
  const od = hasOnDemand(o.items);
  switch (o.status) {
    case 'pendiente_pago':
      return [{ status: 'pagado', label: 'Marcar pagado' }];
    case 'pagado':
      return od ? [{ status: 'proveedor', label: 'Pedido realizado al proveedor' }] : [{ status: 'enviado', label: 'Marcar enviado', needsShipping: true }];
    case 'proveedor':
      return [{ status: 'transito', label: 'En camino a México' }];
    case 'transito':
      return [{ status: 'recibido', label: 'Llegó a México' }];
    case 'recibido':
      return [{ status: 'enviado', label: 'Marcar enviado', needsShipping: true }];
    case 'enviado':
      return [{ status: 'entregado', label: 'Marcar entregado' }];
    default:
      return [];
  }
}

export const canCancel = (s: OrderStatus) => ['pendiente_pago', 'pagado', 'proveedor', 'transito', 'recibido'].includes(s);
export const canAddNote = (s: OrderStatus) => ['pagado', 'proveedor', 'transito', 'recibido', 'enviado'].includes(s);

const lastNote = (o: Order) => {
  const e = (o.events ?? []).slice(-1)[0];
  return e?.note ? ` ${e.note}` : '';
};

/** Mensaje de WhatsApp sugerido para avisar al cliente del estado de su pedido. */
export function customerMessage(o: Order): string | null {
  const name = o.customer?.name ?? '';
  switch (o.status) {
    case 'pendiente_pago':
      return (
        `Hola ${name}, sobre tu pedido ${o.number}: el envío para tu zona es de ${formatMoney(o.shipping)}. ` +
        (Number(o.discount) > 0 ? `Descuento aplicado: ${formatMoney(o.discount)}. ` : '') +
        `Monto final a transferir: ${formatMoney(o.total)}. CLABE: ${BANK.clabe} (${BANK.holder}, ${BANK.bank}). Concepto: ${o.number}.`
      );
    case 'pagado':
      return `Hola ${name}, recibimos tu pago del pedido ${o.number} ✅. Ya lo estamos preparando; te avisamos con tu guía de envío.`;
    case 'proveedor':
      return `Hola ${name}, tu pedido ${o.number} ya fue realizado con nuestro proveedor 📦.${lastNote(o)} Te avisamos en cada etapa.`;
    case 'transito':
      return `Hola ${name}, tu pedido ${o.number} ya va en camino a México ✈️.${lastNote(o)}`;
    case 'recibido':
      return `Hola ${name}, tu pedido ${o.number} ya llegó a México ✅. Estamos preparando tu envío.${lastNote(o)}`;
    case 'enviado':
      return `Hola ${name}, tu pedido ${o.number} va en camino 📦. Paquetería: ${o.carrier}. Guía: ${o.tracking}${o.tracking_url ? `. Rastreo: ${o.tracking_url}` : ''}`;
    case 'entregado':
      return `Hola ${name}, tu pedido ${o.number} fue entregado con éxito 🎉. ¡Gracias por tu compra!`;
    default:
      return null;
  }
}

export const customerAddress = (c: Customer) =>
  [c.street, c.numExt, c.numInt, c.colonia, c.cp ? `CP ${c.cp}` : '', c.city, c.state].filter(Boolean).join(', ');
