'use client';

import { STORAGE_BUCKET } from '@/config/store';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * Sube una imagen al bucket público `fotos` con la sesión del propietario
 * (las políticas de Storage solo permiten subir a usuarios autenticados) y devuelve su URL pública.
 */
export async function uploadImage(blob: Blob, name: string): Promise<string> {
  const db = createSupabaseBrowserClient();
  const ext = (blob.type.split('/')[1] || 'png').replace('+xml', '');
  const path = `${String(name).replace(/[^\w-]/g, '_')}-${Date.now()}.${ext}`;
  const { error } = await db.storage.from(STORAGE_BUCKET).upload(path, blob, { contentType: blob.type, upsert: true, cacheControl: '31536000' });
  if (error) throw new Error(`No se pudo subir la foto: ${error.message}`);
  return db.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}
