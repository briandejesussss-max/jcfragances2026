'use client';

import { Plus, Trash2 } from 'lucide-react';
import { MAX_REFS, NOTE_MAX, SIMILARITY_OPTIONS } from '@/models/domain/inspiration';
import type { Inspiration, InspirationRef } from '@/models/types';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/views/shared/Button';
import { Field, Input, Label } from '@/views/shared/Field';
import { ImageUploadField } from '../shared/ImageUploadField';
import { resizeImage } from '../shared/image-tools';

type Draft = Partial<Inspiration>;

const emptyRef = (): InspirationRef => ({ brand: '', name: '' });

/**
 * Panel → fragancia → "Inspiración (opcional)".
 * Uno o varios perfumes originales (híbridos, hasta 4), qué tan parecido es y una nota corta.
 * Si no hay ningún perfume original, en la tienda no aparece nada.
 */
export function InspirationFields({ value, onChange, uploadName }: { value: Draft | undefined; onChange: (v: Draft) => void; uploadName: string }) {
  const v = value ?? {};
  const refs: InspirationRef[] = [{ brand: v.brand ?? '', name: v.name ?? '', image: v.image }, ...(v.others ?? [])];
  const similarity = v.similarity ?? 'similar';

  const setRefs = (next: InspirationRef[]) => {
    const [first = emptyRef(), ...others] = next;
    onChange({ ...v, brand: first.brand, name: first.name, image: first.image, others });
  };
  const setRef = (k: number, patch: Partial<InspirationRef>) => setRefs(refs.map((r, i) => (i === k ? { ...r, ...patch } : r)));
  const removeRef = (k: number) => setRefs(refs.filter((_, i) => i !== k));

  return (
    <div className="space-y-3 rounded-2xl border border-cork p-3">
      <div>
        <Label>Inspiración (opcional)</Label>
        <p className="text-[11px] text-drift">Para perfumes inspirados en otro. Si es híbrido (mezcla de varios), agrega hasta {MAX_REFS}. Si lo dejas vacío, en la tienda no aparece nada.</p>
      </div>

      {refs.map((r, k) => (
        <div key={k} className="space-y-2 rounded-xl border border-dashed border-cork p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.08em] text-ember">Perfume original {refs.length > 1 ? k + 1 : ''}</span>
            {refs.length > 1 && (
              <button type="button" onClick={() => removeRef(k)} className="inline-flex items-center gap-1 text-[11px] text-sand hover:text-bad" aria-label={`Quitar perfume original ${k + 1}`}>
                <Trash2 className="size-3.5" /> Quitar
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Casa">
              <Input value={r.brand} placeholder={k === 0 ? 'Ej. Escentric Molecules' : 'Ej. Nishane'} maxLength={60} onChange={(e) => setRef(k, { brand: e.target.value })} />
            </Field>
            <Field label="Perfume">
              <Input value={r.name} placeholder={k === 0 ? 'Ej. Molecule 01' : 'Ej. Wulong Cha'} maxLength={60} onChange={(e) => setRef(k, { name: e.target.value })} />
            </Field>
          </div>
          <ImageUploadField
            label="Foto de referencia (opcional)"
            value={r.image ?? ''}
            onChange={(url) => setRef(k, { image: url })}
            name={`${uploadName}-inspiracion-${k + 1}`}
            previewClass="h-16"
            prepare={async (file) => ({ blob: await resizeImage(file, 300, 'image/webp', 0.85), message: 'Foto de referencia lista ✓' })}
          />
        </div>
      ))}

      {refs.length < MAX_REFS && (
        <Button size="sm" variant="ghost" onClick={() => setRefs([...refs, emptyRef()])}>
          <Plus className="size-3.5" /> Agregar otro original (híbrido)
        </Button>
      )}
      <p className="text-[11px] text-drift">Mejor fotos propias del frasco original, solas y con fondo liso; si no tienes, déjalo vacío y se muestra un ícono de frasco.</p>

      <div>
        <Label>¿Qué tan parecido es?</Label>
        <div className="flex flex-wrap gap-1.5">
          {SIMILARITY_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={similarity === o.value}
              onClick={() => onChange({ ...v, similarity: o.value })}
              className={cn('rounded-pill border px-3 py-1.5 text-xs', similarity === o.value ? 'border-cream bg-cream text-walnut' : 'border-cork text-sand hover:text-cream')}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <Field label="Nota corta (opcional)" hint={`${(v.note ?? '').length}/${NOTE_MAX}`}>
        <Input value={v.note ?? ''} placeholder="Ej. Más dulce y dura más que el original" maxLength={NOTE_MAX} onChange={(e) => onChange({ ...v, note: e.target.value })} />
      </Field>
    </div>
  );
}
