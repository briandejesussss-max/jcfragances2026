import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_STORE_CONFIG } from '@/config/store';
import type { StoreConfig } from '../types';

/** Tabla `store_config` (fila única id = 1). */

export async function getStoreConfig(db: SupabaseClient): Promise<StoreConfig> {
  const { data, error } = await db.from('store_config').select('data').eq('id', 1).maybeSingle();
  if (error) throw new Error(`No se pudo leer la configuración de la tienda: ${error.message}`);
  const stored = (data?.data ?? {}) as Partial<StoreConfig>;
  return { ...DEFAULT_STORE_CONFIG, ...stored, sizes: Array.isArray(stored.sizes) ? stored.sizes : [] };
}

export async function saveStoreConfig(db: SupabaseClient, config: StoreConfig): Promise<void> {
  const { error } = await db.from('store_config').upsert({ id: 1, data: config, updated_at: new Date().toISOString() });
  if (error) throw new Error(`No se pudo guardar la configuración: ${error.message}`);
}
