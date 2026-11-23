import { whatsappLink } from '@/lib/utils/whatsapp';
import type { Fragrance, FragranceSummary, SizeConfig, StoreConfig } from '@/models/types';
import { isTesterBottle, partialLabel } from '@/models/domain/sizes';

/** Mensajes prellenados de WhatsApp de la tienda. */

type F = Pick<Fragrance, 'brand' | 'name' | 'concentration' | 'prices'>;

export const adviceLink = (config: StoreConfig) =>
  whatsappLink(config.whatsapp, '¡Hola! Quisiera asesoría para elegir mi próxima fragancia.');

export const fragranceAdviceLink = (config: StoreConfig, f: F) =>
  whatsappLink(
    config.whatsapp,
    `¡Hola! 👋 Me interesa conocer disponibilidad y recomendaciones sobre la fragancia *${f.brand} - ${f.name}*. ¿Qué formatos tienes listos para envío?`,
  );

export const comingSoonLink = (config: StoreConfig, f: F) =>
  whatsappLink(
    config.whatsapp,
    `¡Hola! 👋 Vi que pronto llegará *${f.brand} - ${f.name}* a ${config.name}. ¿Me podrías avisar cuando ya esté disponible? ⏳✨`,
  );

export const sizeOnDemandLink = (config: StoreConfig, sizes: SizeConfig[], f: FragranceSummary | Fragrance, size: string) =>
  whatsappLink(
    config.whatsapp,
    `¡Hola! 👋 Me interesa pedir bajo encargo *${partialLabel(sizes, f as Fragrance, size)}* de:\n\n🏷️ *Casa:* ${f.brand}\n🌸 *Fragancia:* ${f.name}\n\n¿Me confirmas precio y tiempo de entrega por favor?`,
  );

export const bottleOnDemandLink = (config: StoreConfig, f: F, priceText: string) =>
  whatsappLink(
    config.whatsapp,
    `¡Hola! 👋 Me interesa solicitar *BAJO PEDIDO / ENCARGO* el frasco completo de:\n\n` +
      `🏷️ *Casa:* ${f.brand}\n🌸 *Fragancia:* ${f.name}\n🧴 *Tipo de botella:* ${isTesterBottle(f as Fragrance) ? 'Tester' : 'De línea'}\n` +
      `✨ *Concentración:* ${f.concentration || 'EDP'}${priceText ? ` (precio estimado: ${priceText})` : ''}\n\n` +
      `¿Me podrías confirmar tiempo de entrega estimado y coordinar el encargo por favor?`,
  );
