import { statusLabel } from '@/models/domain/orders';
import type { Order, StoreConfig } from '@/models/types';

/** Vista del correo "tu pedido avanzó" (HTML con estilos en línea para clientes de correo). */

const esc = (s: string) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function orderStatusEmail(o: Order, config: StoreConfig, orderUrl: string) {
  const name = o.customer?.name?.split(' ')[0] ?? '';
  const stage = statusLabel(o.status);
  const note = (o.events ?? []).slice(-1)[0]?.note ?? '';
  const subject = `Tu pedido ${o.number}: ${stage.toLowerCase()}`;
  const text =
    `Hola ${name}, tu pedido ${o.number} cambió de etapa: ${stage}.` +
    (note ? `\n\nNota de la tienda: ${note}` : '') +
    `\n\nVer mi pedido: ${orderUrl}\n\n${config.name}`;
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#121212;font-family:Arial,Helvetica,sans-serif;color:#f5f5f5">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#121212;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#000000;border:1px solid #2a2a2a;border-radius:20px;padding:28px 24px">
<tr><td style="font-size:13px;letter-spacing:.08em;font-weight:bold">${esc(config.name)}</td></tr>
<tr><td style="padding-top:18px;font-size:24px;line-height:1.05;text-transform:uppercase">Tu pedido avanzó: <span style="color:#ff6a1a">${esc(stage)}</span></td></tr>
<tr><td style="padding-top:14px;font-size:14px;line-height:1.5;color:#b0b0b0">Hola ${esc(name)}, tu pedido <span style="color:#f5f5f5">${esc(o.number)}</span> cambió de etapa.</td></tr>
${note ? `<tr><td style="padding-top:14px"><div style="background:#121212;border-radius:14px;padding:14px;font-size:14px;line-height:1.5"><div style="font-size:11px;letter-spacing:.08em;color:#b0b0b0;margin-bottom:4px">NOTA DE LA TIENDA</div>${esc(note)}</div></td></tr>` : ''}
${o.tracking ? `<tr><td style="padding-top:14px;font-size:14px;color:#b0b0b0">Paquetería: <b style="color:#f5f5f5">${esc(o.carrier ?? '')}</b> · Guía: <b style="color:#f5f5f5">${esc(o.tracking)}</b></td></tr>` : ''}
<tr><td style="padding-top:22px"><a href="${esc(orderUrl)}" style="display:block;text-align:center;background:#f5f5f5;color:#000000;text-decoration:none;border-radius:36px;padding:14px;font-size:13px;font-weight:bold;letter-spacing:.05em">VER MI PEDIDO</a></td></tr>
<tr><td style="padding-top:18px;font-size:11px;line-height:1.5;color:#b0b0b0">Recibes este correo porque activaste los avisos en tu cuenta. Puedes desactivarlos en Mis datos.</td></tr>
</table></td></tr></table></body></html>`;
  return { subject, html, text };
}
