'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ImageUp, X } from 'lucide-react';
import { guessEmoji, guessImage, PYRAMID_SECTION_LABEL, PYRAMID_SECTIONS } from '@/models/domain/pyramid';
import type { Pyramid, PyramidSection } from '@/models/types';
import { Button } from '@/views/shared/Button';
import { Input, Label } from '@/views/shared/Field';
import { useToast } from '@/views/shared/Toast';
import { resizeImage } from '../shared/image-tools';
import { uploadImage } from '../shared/upload';

const QUICK_EMOJIS = ['🍋', '🍊', '🌹', '🌸', '🌼', '💜', '🍦', '☕', '🍫', '🌰', '🪵', '🟠', '🤍', '💨', '🍂', '🌶️', '🌿', '🌊'];

/** Editor de la pirámide olfativa: notas por sección con emoji, foto opcional y orden. */
export function PyramidEditor({ value, onChange, fragranceId }: { value: Pyramid; onChange: (p: Pyramid) => void; fragranceId: string }) {
  const [drafts, setDrafts] = useState<Record<PyramidSection, { e: string; t: string; img: string }>>({
    top: { e: '', t: '', img: '' },
    mid: { e: '', t: '', img: '' },
    base: { e: '', t: '', img: '' },
  });
  const [active, setActive] = useState<PyramidSection>('top');
  const [uploading, setUploading] = useState<PyramidSection | null>(null);
  const notify = useToast();

  const setDraft = (s: PyramidSection, patch: Partial<{ e: string; t: string; img: string }>) => setDrafts((d) => ({ ...d, [s]: { ...d[s], ...patch } }));

  const add = (s: PyramidSection) => {
    const d = drafts[s];
    const t = d.t.trim();
    if (!t) return;
    const img = d.img.trim() || guessImage(t);
    onChange({ ...value, [s]: [...value[s], { e: d.e.trim() || guessEmoji(t, s), t, ...(img ? { img } : {}) }] });
    setDraft(s, { e: '', t: '', img: '' });
  };

  const remove = (s: PyramidSection, i: number) => onChange({ ...value, [s]: value[s].filter((_, j) => j !== i) });

  const move = (s: PyramidSection, i: number, d: number) => {
    const list = [...value[s]];
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    onChange({ ...value, [s]: list });
  };

  const upload = async (s: PyramidSection, file: File | undefined) => {
    if (!file) return;
    setUploading(s);
    try {
      const url = await uploadImage(await resizeImage(file, 320, 'image/webp', 0.8), `${fragranceId}-nota`);
      setDraft(s, { img: url });
      notify('Foto de la nota lista ✓');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'No se pudo subir la foto', 4000);
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-3">
      <Label>Pirámide olfativa (notas por sección)</Label>
      <div className="flex flex-wrap gap-1">
        {QUICK_EMOJIS.map((e) => (
          <button key={e} type="button" onClick={() => setDraft(active, { e })} className="rounded-md border border-cork px-1.5 py-0.5 text-sm hover:bg-bark" aria-label={`Usar ${e}`}>
            {e}
          </button>
        ))}
      </div>
      {PYRAMID_SECTIONS.map((s) => (
        <div key={s} className="space-y-2 rounded-2xl border border-cork p-3">
          <span className="text-[10px] uppercase tracking-[0.1em] text-ember">{PYRAMID_SECTION_LABEL[s]}</span>
          <div className="flex flex-wrap gap-1.5">
            {value[s].length === 0 && <span className="text-[11px] text-drift">Sin notas todavía</span>}
            {value[s].map((n, i) => (
              <span key={`${n.t}-${i}`} className="inline-flex items-center gap-1 rounded-lg border border-cork bg-walnut px-1.5 py-0.5 text-xs">
                {n.img ? (
                  // eslint-disable-next-line @next/next/no-img-element -- miniatura de la nota
                  <img src={n.img} alt="" className="size-4 rounded object-cover" />
                ) : (
                  <span>{n.e}</span>
                )}
                {n.t}
                {value[s].length > 1 && (
                  <>
                    <button type="button" onClick={() => move(s, i, -1)} aria-label="Mover antes" className="text-sand hover:text-cream">
                      <ChevronLeft className="size-3" />
                    </button>
                    <button type="button" onClick={() => move(s, i, 1)} aria-label="Mover después" className="text-sand hover:text-cream">
                      <ChevronRight className="size-3" />
                    </button>
                  </>
                )}
                <button type="button" onClick={() => remove(s, i)} aria-label="Quitar" className="text-bad">
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="grid grid-cols-12 gap-1.5">
            <Input className="col-span-2 px-2 text-center" value={drafts[s].e} placeholder="🙂" onFocus={() => setActive(s)} onChange={(e) => setDraft(s, { e: e.target.value })} aria-label="Emoji" />
            <Input
              className="col-span-6"
              value={drafts[s].t}
              placeholder={s === 'top' ? 'Ej. Bergamota' : s === 'mid' ? 'Ej. Jazmín' : 'Ej. Ámbar'}
              onFocus={() => setActive(s)}
              onChange={(e) => setDraft(s, { t: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  add(s);
                }
              }}
              aria-label="Nota"
            />
            <label className="col-span-1 grid cursor-pointer place-items-center rounded-xl border border-cork text-sand hover:text-cream" title="Subir foto de la nota">
              <ImageUp className="size-4" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(s, e.target.files?.[0])} />
            </label>
            <Button size="sm" className="col-span-3" onClick={() => add(s)} disabled={uploading === s}>
              {uploading === s ? '…' : 'Agregar'}
            </Button>
            <Input className="col-span-12 text-xs" value={drafts[s].img} placeholder="URL de foto (opcional; si no, se elige una automáticamente)" onChange={(e) => setDraft(s, { img: e.target.value })} />
          </div>
        </div>
      ))}
    </div>
  );
}
