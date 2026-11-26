'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { saveHomeConfigAction } from '@/controllers/home-config.controller';
import { clampCap, DEFAULT_CAP_PCT, DEFAULT_OCCASIONS, MAX_INSTAGRAM } from '@/models/domain/home';
import type { FragranceSummary, HomeConfig, InstagramPhoto } from '@/models/types';
import { Alert } from '@/views/shared/Alert';
import { Button } from '@/views/shared/Button';
import { Field, Input, Label, Select } from '@/views/shared/Field';
import { SmartImage } from '@/views/shared/SmartImage';
import { useToast } from '@/views/shared/Toast';
import { ImageUploadField } from '../shared/ImageUploadField';
import { resizeImage } from '../shared/image-tools';

/**
 * Panel → Tienda → Portada: perfume que se "desglosa" (y dónde termina su tapa),
 * las 4 tarjetas de "Un perfume para cada momento" y las fotos de "Síguenos en Instagram".
 */
export function HomeConfigForm({ home, fragrances }: { home: HomeConfig | undefined; fragrances: FragranceSummary[] }) {
  const router = useRouter();
  const notify = useToast();
  const withImg = fragrances.filter((f) => f.image);
  const [featuredId, setFeaturedId] = useState(home?.featuredId ?? '');
  const [capPct, setCapPct] = useState(clampCap(home?.capPct ?? DEFAULT_CAP_PCT));
  const [occasions, setOccasions] = useState(DEFAULT_OCCASIONS.map((d, i) => ({ title: home?.occasions?.[i]?.title ?? d.title, fragranceId: home?.occasions?.[i]?.fragranceId ?? '' })));
  const [photos, setPhotos] = useState<InstagramPhoto[]>(home?.instagram ?? []);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const featured = withImg.find((f) => f.id === featuredId);

  const setOccasion = (i: number, patch: Partial<{ title: string; fragranceId: string }>) => setOccasions((prev) => prev.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  const setPhoto = (i: number, patch: Partial<InstagramPhoto>) => setPhotos((prev) => prev.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await saveHomeConfigAction({
        featuredId: featuredId || undefined,
        capPct,
        occasions: occasions.map((o) => ({ title: o.title, fragranceId: o.fragranceId || undefined })),
        instagram: photos.filter((p) => p.image),
      });
      if (!res.ok) return setError(res.error);
      notify('Portada actualizada ✓');
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      <div>
        <h2 className="text-xl">Portada</h2>
        <p className="text-sm text-sand">Lo primero que ven tus clientes al entrar a la tienda.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Perfume del desglose */}
        <div className="space-y-3 rounded-3xl border border-cork bg-umber p-4 sm:p-5">
          <Field label="Perfume de portada" hint="Al bajar, se le quita la tapa y salen sus notas. Usa un perfume con foto del frasco solo, de frente y sin fondo, y con su pirámide de notas llena.">
            <Select value={featuredId} onChange={(e) => setFeaturedId(e.target.value)}>
              <option value="">— Ninguno (portada clásica) —</option>
              {withImg.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.brand} · {f.name}
                </option>
              ))}
            </Select>
          </Field>
          {featured && (
            <div className="flex gap-4">
              <div className="relative h-60 w-40 shrink-0 overflow-hidden rounded-2xl bg-bark">
                <SmartImage src={featured.image!} alt={featured.name} fill sizes="160px" className="object-contain" />
                <div className="pointer-events-none absolute inset-x-0 top-0 bg-ember/25" style={{ height: `${capPct}%` }} />
                <div className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-ember" style={{ top: `${capPct}%` }}>
                  <span className="absolute -top-5 left-1 rounded bg-ember px-1.5 text-[10px] font-semibold text-walnut">Tapa ↑</span>
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <Label>¿Dónde termina la tapa?</Label>
                <input type="range" min={5} max={60} value={capPct} onChange={(e) => setCapPct(Number(e.target.value))} className="w-full accent-[var(--color-ember)]" aria-label="Altura de la tapa" />
                <p className="text-xs text-sand">
                  Mueve la barra hasta que la línea punteada quede <b className="text-cream">justo debajo de la tapa</b>. Lo de arriba de la línea es lo que se levanta en la animación. ({capPct}%)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Para cada momento */}
        <div className="space-y-3 rounded-3xl border border-cork bg-umber p-4 sm:p-5">
          <div>
            <Label>Un perfume para cada momento</Label>
            <p className="text-[11px] text-drift">Si lo dejas en “Automático”, se elige solo según la ocasión del perfume.</p>
          </div>
          {occasions.map((o, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <Input value={o.title} maxLength={40} onChange={(e) => setOccasion(i, { title: e.target.value })} aria-label={`Título ${i + 1}`} />
              <Select value={o.fragranceId} onChange={(e) => setOccasion(i, { fragranceId: e.target.value })} aria-label={`Perfume para ${o.title}`}>
                <option value="">Automático</option>
                {withImg.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.brand} · {f.name}
                  </option>
                ))}
              </Select>
            </div>
          ))}
        </div>
      </div>

      {/* Instagram */}
      <div className="space-y-3 rounded-3xl border border-cork bg-umber p-4 sm:p-5">
        <div>
          <Label>Fotos de Instagram (hasta {MAX_INSTAGRAM})</Label>
          <p className="text-[11px] text-drift">Aparecen al final de la portada en cuadrícula. Si pegas el link de la publicación, al tocar la foto se abre esa publicación; si no, tu perfil. Sin fotos, la sección no aparece.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p, i) => (
            <div key={i} className="space-y-2 rounded-2xl border border-dashed border-cork p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.08em] text-ember">Foto {i + 1}</span>
                <button type="button" onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))} className="inline-flex items-center gap-1 text-[11px] text-sand hover:text-bad">
                  <Trash2 className="size-3.5" /> Quitar
                </button>
              </div>
              <ImageUploadField
                label="Foto"
                value={p.image}
                onChange={(url) => setPhoto(i, { image: url })}
                name={`instagram-${i + 1}`}
                previewClass="h-24"
                prepare={async (file) => ({ blob: await resizeImage(file, 900, 'image/webp', 0.82), message: 'Foto lista ✓' })}
              />
              <Input value={p.link ?? ''} onChange={(e) => setPhoto(i, { link: e.target.value })} placeholder="Link de la publicación (opcional)" />
            </div>
          ))}
        </div>
        {photos.length < MAX_INSTAGRAM && (
          <Button size="sm" variant="ghost" onClick={() => setPhotos((prev) => [...prev, { image: '' }])}>
            <Plus className="size-3.5" /> Agregar foto
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {error && <Alert className="w-full">{error}</Alert>}
        <Button type="submit" variant="cream" size="lg" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar portada'}
        </Button>
      </div>
    </form>
  );
}
