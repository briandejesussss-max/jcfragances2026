'use client';

import { useRef, useState } from 'react';
import { ImageUp, Trash2 } from 'lucide-react';
import { Button } from '@/views/shared/Button';
import { Input, Label } from '@/views/shared/Field';
import { useToast } from '@/views/shared/Toast';
import { uploadImage } from './upload';

interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** Convierte el archivo antes de subirlo (recorte, limpieza de fondo…) */
  prepare: (file: File) => Promise<{ blob: Blob; message?: string }>;
  name: string;
  previewClass?: string;
}

/** Campo de foto: subir archivo a Storage o pegar un enlace https. */
export function ImageUploadField({ label, value, onChange, prepare, name, previewClass = 'h-28' }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const notify = useToast();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const { blob, message } = await prepare(file);
      onChange(await uploadImage(blob, name));
      notify(message ?? 'Foto subida ✓', 2600);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'No se pudo subir la foto', 4000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-start gap-3">
        <div className={`grid w-28 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-cork bg-walnut ${previewClass}`}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- vista previa de una URL arbitraria
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImageUp className="size-6 text-drift" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <Input value={value} onChange={(e) => onChange(e.target.value.trim())} placeholder="https://… o sube un archivo" />
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => input.current?.click()} disabled={busy}>
              <ImageUp className="size-3.5" /> {busy ? 'Subiendo…' : 'Subir archivo'}
            </Button>
            {value && (
              <Button size="sm" variant="danger" onClick={() => onChange('')}>
                <Trash2 className="size-3.5" /> Quitar
              </Button>
            )}
          </div>
        </div>
      </div>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  );
}
