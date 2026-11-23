'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, KeyRound, Search, X } from 'lucide-react';
import { resetCustomerPasswordAction } from '@/controllers/customers.controller';
import { formatDate } from '@/lib/utils/format';
import { whatsappLink } from '@/lib/utils/whatsapp';
import type { CustomerAccount } from '@/models/types';
import { Alert } from '@/views/shared/Alert';
import { Button, buttonClass } from '@/views/shared/Button';
import { Input } from '@/views/shared/Field';
import { useToast } from '@/views/shared/Toast';
import { PageTitle } from '../shared/PageTitle';

const SITE = 'https://jcfragances2026.vercel.app';

/** Panel → Clientes: cuentas registradas y contraseña temporal para quien olvidó la suya. */
export function CustomersList({ customers, query }: { customers: CustomerAccount[]; query: string }) {
  const router = useRouter();
  const [q, setQ] = useState(query);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(q.trim() ? `/admin/clientes?q=${encodeURIComponent(q.trim())}` : '/admin/clientes');
  };

  return (
    <>
      <PageTitle title={`Clientes (${customers.length}${customers.length === 100 ? '+' : ''})`} />
      <form onSubmit={search} className="mb-4 flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Buscar cliente</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-drift" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por correo, nombre o teléfono…" className="pl-9" />
        </label>
        <Button type="submit" variant="ghost">
          Buscar
        </Button>
      </form>

      <Alert tone="info" className="mb-4">
        Si un cliente olvidó su contraseña, primero confirma que es él: que te escriba desde el teléfono de sus pedidos o te dé un número de pedido y su correo. Luego genera una contraseña temporal y mándasela.
      </Alert>

      {customers.length === 0 ? (
        <p className="rounded-3xl border border-cork bg-umber p-6 text-center text-sm text-sand">{query ? 'No hay clientes con esa búsqueda.' : 'Aún no hay clientes registrados.'}</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {customers.map((c) => (
            <CustomerCard key={c.id} customer={c} />
          ))}
        </div>
      )}
    </>
  );
}

function CustomerCard({ customer: c }: { customer: CustomerAccount }) {
  const notify = useToast();
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = () =>
    start(async () => {
      setError(null);
      const res = await resetCustomerPasswordAction(c.id);
      setConfirming(false);
      if (!res.ok) return setError(res.error);
      setPassword(res.data.password);
    });

  const copy = (text: string) =>
    navigator.clipboard
      .writeText(text)
      .then(() => notify('Copiada ✓'))
      .catch(() => notify('No se pudo copiar; selecciónala y cópiala a mano'));

  const message = password
    ? `Hola${c.name ? ` ${c.name.split(' ')[0]}` : ''}, ya restablecí tu cuenta de JS FRAGANCES.\n\nCorreo: ${c.email}\nContraseña temporal: ${password}\n\nEntra en ${SITE}/cuenta/ingresar y cámbiala en Mi cuenta → Mis datos → Cambiar contraseña.`
    : '';

  return (
    <article className="space-y-3 rounded-3xl border border-cork bg-umber p-4 text-sm">
      <div>
        <p className="font-medium">{c.name || 'Sin nombre'}</p>
        <p className="break-all text-sand">{c.email}</p>
        {c.phone && <p className="text-sand">{c.phone}</p>}
      </div>
      <p className="text-[11px] text-drift">
        Cuenta desde {formatDate(c.createdAt)} · Última entrada {c.lastSignInAt ? formatDate(c.lastSignInAt) : '—'} · {c.ordersCount}{' '}
        {c.ordersCount === 1 ? 'pedido' : 'pedidos'}
      </p>

      {password ? (
        <div className="space-y-2 rounded-2xl border border-ok/50 bg-ok/10 p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-ok">Contraseña temporal lista. Solo se muestra esta vez.</p>
            <button type="button" onClick={() => setPassword(null)} aria-label="Cerrar" className="text-sand hover:text-cream">
              <X className="size-4" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-xl bg-walnut px-3 py-2">
            <code className="select-all font-mono text-base tracking-wide text-cream">{password}</code>
            <Button size="sm" variant="ghost" onClick={() => copy(password)}>
              <Copy className="size-3.5" /> Copiar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {c.phone ? (
              <a href={whatsappLink(c.phone, message)} target="_blank" rel="noopener noreferrer" className={buttonClass('whatsapp', 'sm')}>
                Enviar por WhatsApp
              </a>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => copy(message)}>
                <Copy className="size-3.5" /> Copiar mensaje para WhatsApp
              </Button>
            )}
          </div>
          <p className="text-[11px] text-sand">Se cerraron las sesiones abiertas de esta cuenta. La contraseña anterior ya no funciona.</p>
        </div>
      ) : confirming ? (
        <div className="space-y-2 rounded-2xl border border-ember/50 bg-ember/10 p-3">
          <p className="text-xs">¿Generar una contraseña temporal para {c.email}? Su contraseña actual dejará de funcionar.</p>
          <div className="flex gap-2">
            <Button size="sm" variant="cream" onClick={generate} disabled={pending}>
              {pending ? 'Generando…' : 'Sí, generar'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={pending}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="ghost" onClick={() => setConfirming(true)}>
          <KeyRound className="size-3.5" /> Contraseña temporal
        </Button>
      )}
      {error && <Alert>{error}</Alert>}
    </article>
  );
}
