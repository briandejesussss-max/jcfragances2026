'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveFragranceAction } from '@/controllers/fragrance.controller';
import { GENDER_OPTIONS } from '@/models/domain/catalog';
import { PROFILE_FIELDS } from '@/models/domain/profile';
import { emptyPyramid, pyramidFor } from '@/models/domain/pyramid';
import { sizesOf } from '@/models/domain/sizes';
import type { Fragrance, Profile, StoreConfig } from '@/models/types';
import { Alert } from '@/views/shared/Alert';
import { Button } from '@/views/shared/Button';
import { Checkbox, Field, Input, Label, Select, Textarea } from '@/views/shared/Field';
import { useToast } from '@/views/shared/Toast';
import { ImageUploadField } from '../shared/ImageUploadField';
import { prepareBottlePhoto, resizeImage } from '../shared/image-tools';
import { InspirationFields } from './InspirationFields';
import { PyramidEditor } from './PyramidEditor';
import { SizePriceFields } from './SizePriceFields';

const blank = (): Fragrance => ({
  id: '',
  name: '',
  brand: '',
  concentration: 'Eau de Parfum',
  gender: 'Unisex',
  image: '',
  notes: '',
  comingSoon: false,
  profile: {},
  prices: {},
});

/** Alta y edición de fragancias. */
export function FragranceForm({ initial, config }: { initial: Fragrance | null; config: StoreConfig }) {
  const router = useRouter();
  const notify = useToast();
  const sizes = useMemo(() => sizesOf(config), [config]);
  const [f, setF] = useState<Fragrance>(() => {
    const base = initial ?? blank();
    // Si no hay pirámide guardada pero las notas traen secciones, se precarga para editarla.
    return { ...base, pyramid: base.pyramid ?? pyramidFor(base, true) ?? emptyPyramid() };
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const uploadName = f.id || 'frag-nueva';

  const set = <K extends keyof Fragrance>(k: K, v: Fragrance[K]) => setF((prev) => ({ ...prev, [k]: v }));
  const setProfile = (k: keyof Profile, v: string) => setF((prev) => ({ ...prev, profile: { ...(prev.profile ?? {}), [k]: v } }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await saveFragranceAction(f);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      notify(initial ? 'Fragancia actualizada ✓' : 'Fragancia agregada ✓');
      router.push('/admin/fragancias');
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-4 rounded-3xl border border-cork bg-umber p-4 sm:p-5">
        <Checkbox label="⏳ Próximamente (aún no se puede comprar)" checked={!!f.comingSoon} onChange={(e) => set('comingSoon', e.target.checked)} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre" className="col-span-2 sm:col-span-1">
            <Input value={f.name} onChange={(e) => set('name', e.target.value)} required />
          </Field>
          <Field label="Marca / casa" className="col-span-2 sm:col-span-1">
            <Input value={f.brand} onChange={(e) => set('brand', e.target.value)} required />
          </Field>
          <Field label="Concentración">
            <Input value={f.concentration ?? ''} onChange={(e) => set('concentration', e.target.value)} />
          </Field>
          <Field label="Categoría">
            <Select value={f.gender ?? 'Unisex'} onChange={(e) => set('gender', e.target.value)}>
              {GENDER_OPTIONS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </Select>
          </Field>
        </div>
        <ImageUploadField
          label="Fotografía del frasco"
          value={f.image ?? ''}
          onChange={(url) => set('image', url)}
          name={uploadName}
          prepare={async (file) => {
            const { blob, cleaned } = await prepareBottlePhoto(file);
            return { blob, message: cleaned ? 'Fondo negro quitado automáticamente ✓' : undefined };
          }}
        />
        <SizePriceFields sizes={sizes} prices={f.prices ?? {}} stock={f.stock} onPrices={(p) => set('prices', p)} onStock={(s) => set('stock', s)} />
        <InspirationFields value={f.inspiration} onChange={(v) => set('inspiration', v as Fragrance['inspiration'])} uploadName={uploadName} />
      </div>

      <div className="space-y-4 rounded-3xl border border-cork bg-umber p-4 sm:p-5">
        <div>
          <Label>Radiografía olfativa</Label>
          <div className="grid grid-cols-2 gap-2">
            {PROFILE_FIELDS.map((p) =>
              p.multiline ? (
                <Textarea key={p.key} className="col-span-2" placeholder={p.placeholder} value={f.profile?.[p.key] ?? ''} onChange={(e) => setProfile(p.key, e.target.value)} aria-label={p.placeholder} />
              ) : (
                <Input key={p.key} placeholder={p.placeholder} value={f.profile?.[p.key] ?? ''} onChange={(e) => setProfile(p.key, e.target.value)} aria-label={p.placeholder} />
              ),
            )}
          </div>
          <p className="mt-1 text-[11px] text-drift">Lo que dejes vacío usa los valores por defecto de la tienda.</p>
        </div>
        <ImageUploadField
          label="Foto de fondo de la ficha (opcional)"
          value={f.bgImage ?? ''}
          onChange={(url) => set('bgImage', url)}
          name={`${uploadName}-fondo`}
          previewClass="h-20"
          prepare={async (file) => ({ blob: await resizeImage(file, 1400, 'image/jpeg', 0.82), message: 'Foto de fondo lista ✓' })}
        />
        <PyramidEditor value={f.pyramid ?? emptyPyramid()} onChange={(p) => set('pyramid', p)} fragranceId={uploadName} />
        <Field label="Descripción / notas generales (opcional)" hint="Si lo dejas vacío, se usan las notas de la pirámide.">
          <Textarea value={f.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
        {error && <Alert className="w-full">{error}</Alert>}
        <Button type="submit" variant="cream" size="lg" disabled={pending}>
          {pending ? 'Guardando…' : initial ? 'Guardar cambios' : 'Agregar fragancia'}
        </Button>
        <Button variant="ghost" size="lg" onClick={() => router.push('/admin/fragancias')}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
