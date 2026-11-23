'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveStoreConfigAction } from '@/controllers/store-config.controller';
import { sizesOf } from '@/models/domain/sizes';
import type { StoreConfig } from '@/models/types';
import { Alert } from '@/views/shared/Alert';
import { Button } from '@/views/shared/Button';
import { Field, Input } from '@/views/shared/Field';
import { useToast } from '@/views/shared/Toast';
import { ImageUploadField } from '../shared/ImageUploadField';
import { resizeImage } from '../shared/image-tools';
import { PageTitle } from '../shared/PageTitle';
import { SizesEditor } from './SizesEditor';

export function StoreConfigForm({ config }: { config: StoreConfig }) {
  const router = useRouter();
  const notify = useToast();
  const [c, setC] = useState<StoreConfig>({ ...config, sizes: sizesOf(config) });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof StoreConfig>(k: K, v: StoreConfig[K]) => setC((prev) => ({ ...prev, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await saveStoreConfigAction(c);
      if (!res.ok) return setError(res.error);
      notify('Datos de tienda actualizados ✓');
      router.refresh();
    });
  };

  return (
    <>
      <PageTitle title="Datos de la tienda" />
      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-3 rounded-3xl border border-cork bg-umber p-4 sm:p-5">
          <Field label="Nombre comercial">
            <Input value={c.name} onChange={(e) => set('name', e.target.value)} required />
          </Field>
          <Field label="Lema">
            <Input value={c.tagline} onChange={(e) => set('tagline', e.target.value)} />
          </Field>
          <Field label="WhatsApp de pedidos">
            <Input value={c.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} required />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Instagram">
              <Input value={c.instagram} onChange={(e) => set('instagram', e.target.value)} />
            </Field>
            <Field label="Link de Instagram">
              <Input value={c.instagramUrl ?? ''} onChange={(e) => set('instagramUrl', e.target.value)} />
            </Field>
          </div>
          <Field label="Notas de envío">
            <Input value={c.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
          <ImageUploadField
            label="Logotipo"
            value={c.logo}
            onChange={(url) => set('logo', url)}
            name="logo"
            previewClass="h-28"
            prepare={async (file) => ({ blob: await resizeImage(file, 320, 'image/png'), message: 'Logotipo listo ✓ guarda para aplicarlo' })}
          />
        </div>
        <div className="space-y-3 rounded-3xl border border-cork bg-umber p-4 sm:p-5">
          <SizesEditor value={c.sizes} onChange={(s) => set('sizes', s)} />
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
          {error && <Alert className="w-full">{error}</Alert>}
          <Button type="submit" variant="cream" size="lg" disabled={pending}>
            {pending ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </form>
    </>
  );
}
