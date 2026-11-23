'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { ArrowLeft } from 'lucide-react';
import { saveProfileAction } from '@/controllers/account.controller';
import { MEXICAN_STATES } from '@/models/domain/address';
import type { Customer, CustomerProfile } from '@/models/types';
import { Alert } from '@/views/shared/Alert';
import { Button } from '@/views/shared/Button';
import { Field, Input, Select } from '@/views/shared/Field';

const PROVIDER_LABEL: Record<string, string> = { email: 'correo', google: 'Google' };

/** "Mis datos": contacto, dirección para la próxima compra y avisos por correo. */
export function ProfileForm({ profile, email, providers }: { profile: CustomerProfile; email: string; providers: string[] }) {
  const [p, setP] = useState(profile);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const setAddr = (k: keyof Customer, v: string) => setP((prev) => ({ ...prev, address: { ...prev.address, [k]: v } }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await saveProfileAction(p);
      setMsg(res.ok ? { ok: true, text: 'Datos guardados ✓' } : { ok: false, text: res.error });
    });
  };

  const a = p.address;
  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      <Link href="/cuenta" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-sand hover:text-cream">
        <ArrowLeft className="size-4" /> Mis pedidos
      </Link>
      <h1 className="text-3xl">Mis datos</h1>

      <section className="grid grid-cols-2 gap-3 rounded-3xl border border-cork bg-umber p-4">
        <Field label="Nombre" className="col-span-2">
          <Input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} autoComplete="name" required />
        </Field>
        <Field label="Teléfono">
          <Input value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} inputMode="tel" autoComplete="tel" />
        </Field>
        <Field label="Código postal">
          <Input value={a.cp ?? ''} onChange={(e) => setAddr('cp', e.target.value.replace(/\D/g, '').slice(0, 5))} inputMode="numeric" />
        </Field>
        <Field label="Calle" className="col-span-2">
          <Input value={a.street ?? ''} onChange={(e) => setAddr('street', e.target.value)} autoComplete="address-line1" />
        </Field>
        <Field label="No. exterior">
          <Input value={a.numExt ?? ''} onChange={(e) => setAddr('numExt', e.target.value)} />
        </Field>
        <Field label="No. interior">
          <Input value={a.numInt ?? ''} onChange={(e) => setAddr('numInt', e.target.value)} />
        </Field>
        <Field label="Colonia">
          <Input value={a.colonia ?? ''} onChange={(e) => setAddr('colonia', e.target.value)} />
        </Field>
        <Field label="Ciudad">
          <Input value={a.city ?? ''} onChange={(e) => setAddr('city', e.target.value)} />
        </Field>
        <Field label="Estado" className="col-span-2">
          <Select value={a.state ?? ''} onChange={(e) => setAddr('state', e.target.value)}>
            <option value="">Selecciona</option>
            {[...new Set([...MEXICAN_STATES, ...(a.state ? [a.state] : [])])].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <p className="col-span-2 text-xs text-sand">Se llena sola en tu próxima compra.</p>
      </section>

      <section className="rounded-3xl border border-cork bg-umber p-4">
        <p className="text-[10px] uppercase tracking-[0.1em] text-ember">Avisos</p>
        <label className="mt-3 flex items-center justify-between gap-4 text-sm">
          <span>
            Avisarme por correo
            <span className="block text-xs text-sand">Cuando mi pedido cambie de etapa</span>
          </span>
          <input type="checkbox" role="switch" checked={p.notifyEmail} onChange={(e) => setP({ ...p, notifyEmail: e.target.checked })} className="size-5 accent-ember" />
        </label>
      </section>

      <section className="space-y-2 rounded-3xl border border-dashed border-cork p-4 text-sm">
        <p className="text-[10px] uppercase tracking-[0.1em] text-sand">Cuenta</p>
        <p>
          {email} <span className="text-ok">· confirmado</span>
        </p>
        <p className="text-xs text-sand">Entras con: {providers.map((x) => PROVIDER_LABEL[x] ?? x).join(' y ')}</p>
        <Link href="/cuenta/nueva-contrasena" className="text-xs text-sand underline underline-offset-4">
          {providers.includes('email') ? 'Cambiar contraseña' : 'Crear una contraseña'}
        </Link>
      </section>

      {msg && <Alert tone={msg.ok ? 'ok' : 'warn'}>{msg.text}</Alert>}
      <Button type="submit" variant="cream" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Guardando…' : 'Guardar'}
      </Button>
    </form>
  );
}
