'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { saveHomeConfigAction } from '@/controllers/home-config.controller';
import { CAPTION_MAX, DEFAULT_OCCASIONS, MAX_CAROUSEL, MAX_INSTAGRAM } from '@/models/domain/home';
import type { FragranceSummary, HomeConfig, InstagramPhoto } from '@/models/types';
import { Alert } from '@/views/shared/Alert';
import { Button } from '@/views/shared/Button';
import { Field, Input, Label, Select } from '@/views/shared/Field';
import { SmartImage } from '@/views/shared/SmartImage';
import { useToast } from '@/views/shared/Toast';
import { ImageUploadField } from '../shared/ImageUploadField';
import { resizeImage } from '../shared/image-tools';

/**
 * Panel → Tienda → Portada: perfumes del carrusel de la portada (y su orden),
 * las 4 tarjetas de "Un perfume para cada momento" y las fotos de "Síguenos en Instagram".
 */
export function HomeConfigForm({ home, fragrances }: { home: HomeConfig | undefined; fragrances: FragranceSummary[] }) {
  const router = useRouter();
  const notify = useToast();
  const withImg = fragrances.filter((f) => f.image);
  const [carousel, setCarousel] = useState<string[]>(home?.carouselIds?.length ? home.carouselIds : home?.featuredId ? [home.featuredId] : []);
  const [occasions, setOccasions] = useState(DEFAULT_OCCASIONS.map((d, i) => ({ title: home?.occasions?.[i]?.title ?? d.title, fragranceId: home?.occasions?.[i]?.fragranceId ?? '' })));
  const [photos, setPhotos] = useState<InstagramPhoto[]>(home?.instagram ?? []);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const byId = new Map(withImg.map((f) => [f.id, f]));

  const setOccasion = (i: number, patch: Partial<{ title: string; fragranceId: string }>) => setOccasions((prev) => prev.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  const setPhoto = (i: number, patch: Partial<InstagramPhoto>) => setPhotos((prev) => prev.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const moveIn = <T,>(list: T[], i: number, d: number) => {
    const next = [...list];
    const j = i + d;
    if (j < 0 || j >= next.length) return list;
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  };
  const movePhoto = (i: number, d: number) =>
    setPhotos((prev) => {
      const next = [...prev];
      const j = i + d;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await saveHomeConfigAction({
        carouselIds: carousel.filter(Boolean),
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
        {/* Carrusel de la portada */}
        <div className="space-y-3 rounded-3xl border border-cork bg-umber p-4 sm:p-5">
          <div>
            <Label>Perfumes del carrusel (hasta {MAX_CAROUSEL})</Label>
            <p className="text-[11px] text-drift">Es lo primero que ven tus clientes: pasan solos cada pocos segundos, en este orden. Si dejas la lista vacía, se muestran los más nuevos del catálogo.</p>
          </div>
          {carousel.map((id, i) => {
            const f = byId.get(id);
            return (
              <div key={`${id}-${i}`} className="flex items-center gap-2">
                <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-bark">{f?.image && <SmartImage src={f.image} alt="" fill sizes="48px" className="object-contain" />}</span>
                <Select value={id} onChange={(e) => setCarousel((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))} aria-label={`Perfume ${i + 1} del carrusel`} className="min-w-0 flex-1">
                  {withImg.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name} · {x.brand}
                    </option>
                  ))}
                </Select>
                <button type="button" disabled={i === 0} onClick={() => setCarousel((prev) => moveIn(prev, i, -1))} aria-label={`Subir perfume ${i + 1}`} className="grid size-8 shrink-0 place-items-center rounded-full border border-cork text-sand hover:text-cream disabled:opacity-30">
                  <ArrowLeft className="size-3.5 rotate-90" />
                </button>
                <button type="button" disabled={i === carousel.length - 1} onClick={() => setCarousel((prev) => moveIn(prev, i, 1))} aria-label={`Bajar perfume ${i + 1}`} className="grid size-8 shrink-0 place-items-center rounded-full border border-cork text-sand hover:text-cream disabled:opacity-30">
                  <ArrowRight className="size-3.5 rotate-90" />
                </button>
                <button type="button" onClick={() => setCarousel((prev) => prev.filter((_, j) => j !== i))} aria-label={`Quitar perfume ${i + 1}`} className="grid size-8 shrink-0 place-items-center rounded-full border border-cork text-sand hover:text-bad">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            );
          })}
          {carousel.length < MAX_CAROUSEL && withImg.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setCarousel((prev) => [...prev, withImg.find((f) => !prev.includes(f.id))?.id ?? withImg[0].id])}>
              <Plus className="size-3.5" /> Agregar perfume
            </Button>
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
          <p className="text-[11px] text-drift">
            Aparecen al final de la portada en una fila tipo historias que se desliza de lado; al tocar una se abre en grande. Puedes ponerle un texto corto y un perfume de referencia (aparece el botón “Ver perfume”). Si pegas el link de la publicación, “Ver en Instagram” abre esa publicación; si no, tu perfil. Sin fotos, la sección no aparece.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p, i) => (
            <div key={i} className="space-y-2 rounded-2xl border border-dashed border-cork p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-[0.08em] text-ember">Foto {i + 1}</span>
                <span className="flex items-center gap-1">
                  <button type="button" disabled={i === 0} onClick={() => movePhoto(i, -1)} aria-label={`Mover foto ${i + 1} antes`} className="grid size-7 place-items-center rounded-full border border-cork text-sand hover:text-cream disabled:opacity-30">
                    <ArrowLeft className="size-3.5" />
                  </button>
                  <button type="button" disabled={i === photos.length - 1} onClick={() => movePhoto(i, 1)} aria-label={`Mover foto ${i + 1} después`} className="grid size-7 place-items-center rounded-full border border-cork text-sand hover:text-cream disabled:opacity-30">
                    <ArrowRight className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))} className="ml-1 inline-flex items-center gap-1 text-[11px] text-sand hover:text-bad">
                    <Trash2 className="size-3.5" /> Quitar
                  </button>
                </span>
              </div>
              <ImageUploadField
                label="Foto"
                value={p.image}
                onChange={(url) => setPhoto(i, { image: url })}
                name={`instagram-${i + 1}`}
                previewClass="h-24"
                prepare={async (file) => ({ blob: await resizeImage(file, 900, 'image/webp', 0.82), message: 'Foto lista ✓' })}
              />
              <Input value={p.caption ?? ''} maxLength={CAPTION_MAX} onChange={(e) => setPhoto(i, { caption: e.target.value })} placeholder="Texto corto (ej. Pedido listo para Monterrey 📦)" aria-label={`Texto de la foto ${i + 1}`} />
              <Select value={p.fragranceId ?? ''} onChange={(e) => setPhoto(i, { fragranceId: e.target.value || undefined })} aria-label={`Perfume de referencia de la foto ${i + 1}`}>
                <option value="">Sin perfume de referencia</option>
                {withImg.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.brand} · {f.name}
                  </option>
                ))}
              </Select>
              <Input value={p.link ?? ''} onChange={(e) => setPhoto(i, { link: e.target.value })} placeholder="Link de la publicación (opcional)" aria-label={`Link de la foto ${i + 1}`} />
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
