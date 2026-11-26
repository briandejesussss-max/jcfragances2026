import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminStats } from '../types';

/** Resumen de estadísticas de los últimos `days` días (solo administradores). */
export async function getAdminStats(db: SupabaseClient, days: number): Promise<AdminStats> {
  const { data, error } = await db.rpc('admin_stats', { p_days: days });
  if (error) throw new Error(error.message);
  return data as AdminStats;
}
