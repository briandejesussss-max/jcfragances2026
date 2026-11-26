'use client';

import { NOTE_MAX, SIMILARITY_OPTIONS } from '@/models/domain/inspiration';
import type { Inspiration } from '@/models/types';
import { cn } from '@/lib/utils/cn';
import { Field, Input, Label } from '@/views/shared/Field';
import { ImageUploadField } from '../shared/ImageUploadField';
import { resizeImage } from '../shared/image-tools';

type Draft = Partial<Inspiration>;

/** Panel → fragancia → "Inspiración (opcional)". Sin nombre del original no aparece nada en la tienda. */
export function InspirationFields({ value, onChange, uploadName }: { value: Draft | undefined; onChange: (v: Draft) => void; uploadName: string }) {
  const v = value ?? {};
  const set = <K extends keyof Inspiration>(k: K, val: Inspiration[K]) => onChange({ ...v, [k]: val });
  const similarity = v.similarity ?? 'similar';

  return (
    <div className="space-y-3 rounded-2xl border border-cork p-3">
      <div>
        <Label>Inspiración (opcional)</Label>
        <p className="text-[11px] text-drift">Para perfumes inspirados en otro. Si dejas vacío el perfume original, en la tienda no aparece nada.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Casa original">
          <Input value={v.brand ?? ''} placeholder="Ej. Creed" maxLength={60} onChange={(e) => set('brand', e.target.value)} />
        </Field>
        <Field label="Perfume original">
          <Input value={v.name ?? ''} placeholder="Ej. Aventus" maxLength={60} onChange={(e) => set('name', e.target.value)} />
        </Field>
      </div>
      <div>
        <Label>¿Qué tan parecido es?</Label>
        <div className="flex flex-wrap gap-1.5">
          {SIMILARITY_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={similarity === o.value}
              onClick={() => set('similarity', o.value)}
              className={cn('rounded-pill border px-3 py-1.5 text-xs', similarity === o.value ? 'border-cream bg-cream text-walnut' : 'border-cork text-sand hover:text-cream')}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <ImageUploadField
        label="Foto de referencia (opcional)"
        value={v.image ?? ''}
        onChange={(url) => set('image', url)}
        name={`${uploadName}-inspiracion`}
        previewClass="h-16"
        prepare={async (file) => ({ blob: await resizeImage(file, 300, 'image/webp', 0.85), message: 'Foto de referencia lista ✓' })}
      />
      <p className="-mt-2 text-[11px] text-drift">Mejor una foto propia del frasco original; si no tienes, déjalo vacío y se muestra un ícono de frasco.</p>
      <Field label="Nota corta (opcional)" hint={`${(v.note ?? '').length}/${NOTE_MAX}`}>
        <Input value={v.note ?? ''} placeholder="Ej. Más dulce y dura más que el original" maxLength={NOTE_MAX} onChange={(e) => set('note', e.target.value)} />
      </Field>
    </div>
  );
}
