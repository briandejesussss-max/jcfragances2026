/** Enlace de WhatsApp. Números de 10 dígitos se completan con la lada 52 de México. */
export function whatsappLink(phone: string, message: string): string {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) digits = '52' + digits;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
