'use client';

import { useEffect, useState, useTransition } from 'react';
import { getCheckoutDefaultsAction } from '@/controllers/account.controller';
import { placeOrder, type PlacedOrder } from '@/controllers/checkout.controller';
import { MEXICAN_STATES } from '@/models/domain/address';
import { CUSTOMER_REQUIRED } from '@/models/domain/orders';
import type { Customer } from '@/models/types';
import { Alert } from '@/views/shared/Alert';
import { Button } from '@/views/shared/Button';
import { Field, Input, Select } from '@/views/shared/Field';
import { useToast } from '@/views/shared/Toast';
import { usePersistentState } from '../state/usePersistentState';
import { useStore } from '../state/StoreProvider';
import { useZipLookup } from './useZipLookup';

const EMPTY: Customer = { name: '', phone: '', email: '', street: '', numExt: '', numInt: '', cp: '', colonia: '', city: '', state: '' };

/** Datos de entrega y envío del pedido. El total definitivo lo calcula el servidor. */
export function CheckoutForm({ onPlaced, disabled }: { onPlaced: (o: PlacedOrder, email: string) => void; disabled: boolean }) {
  const { cart } = useStore();
  const notify = useToast();
  // Se recuerdan los datos en este dispositivo para la próxima compra.
  const [c, setC] = usePersistentState<Customer>('jf26_customer', EMPTY);
  const [noExt, setNoExt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const zip = useZipLookup(c.cp);

  const set = (k: keyof Customer, v: string) => setC((prev) => ({ ...prev, [k]: v }));

  // Con sesión iniciada, llena los campos vacíos con los datos guardados en su cuenta.
  useEffect(() => {
    let cancelled = false;
    getCheckoutDefaultsAction()
      .then((d) => {
        if (cancelled || !d) return;
        setC((prev) => {
          const next = { ...prev };
          (Object.keys(d) as Array<keyof Customer>).forEach((k) => {
            if (!String(next[k] ?? '').trim() && d[k]) next[k] = String(d[k]);
          });
          return next;
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [setC]);

  useEffect(() => {
    if (zip.status !== 'ok' || !zip.info) return;
    const info = zip.info;
     
    setC((prev) => ({
      ...prev,
      city: prev.city || info.city,
      state: prev.state || info.state,
      colonia: prev.colonia || (info.colonias.length === 1 ? info.colonias[0] : ''),
    }));
  }, [zip, setC]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const missing = CUSTOMER_REQUIRED.filter((k) => !String(c[k] ?? '').trim());
    if (missing.length) {
      setError('Completa tus datos de entrega');
      return;
    }
    startTransition(async () => {
      notify('Verificando disponibilidad...', 1500);
      const res = await placeOrder({ customer: { ...c, numExt: noExt ? 'S/N' : c.numExt }, lines: cart });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onPlaced(res.data, c.email);
    });
  };

  const colonias = zip.info?.colonias ?? [];

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-sand">Datos de entrega</p>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Nombre completo" className="col-span-2">
          <Input value={c.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" required />
        </Field>
        <Field label="Teléfono">
          <Input value={c.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="tel" autoComplete="tel" required />
        </Field>
        <Field label="Correo">
          <Input type="email" value={c.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" required />
        </Field>
        <Field label="Calle" className="col-span-2">
          <Input value={c.street} onChange={(e) => set('street', e.target.value)} autoComplete="address-line1" required />
        </Field>
        <Field label="No. exterior">
          <Input value={noExt ? 'S/N' : c.numExt} disabled={noExt} onChange={(e) => set('numExt', e.target.value)} required={!noExt} />
        </Field>
        <Field label="No. interior">
          <Input value={c.numInt} onChange={(e) => set('numInt', e.target.value)} />
        </Field>
        <label className="col-span-2 -mt-1 flex items-center gap-2 text-[11px] text-sand">
          <input type="checkbox" checked={noExt} onChange={(e) => setNoExt(e.target.checked)} className="accent-ember" /> Sin número exterior
        </label>
        <Field
          label="Código postal"
          hint={zip.status === 'loading' ? 'Buscando C.P. …' : zip.status === 'error' ? 'No pude validar el C.P.: llena colonia, ciudad y estado a mano.' : zip.status === 'ok' ? '✓ C.P. encontrado' : undefined}
        >
          <Input value={c.cp} onChange={(e) => set('cp', e.target.value.replace(/\D/g, '').slice(0, 5))} inputMode="numeric" autoComplete="postal-code" required />
        </Field>
        <Field label="Colonia">
          {colonias.length > 1 ? (
            <Select value={c.colonia} onChange={(e) => set('colonia', e.target.value)} required>
              <option value="">Selecciona una colonia</option>
              {colonias.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          ) : (
            <Input value={c.colonia} onChange={(e) => set('colonia', e.target.value)} required />
          )}
        </Field>
        <Field label="Ciudad / municipio">
          <Input value={c.city} onChange={(e) => set('city', e.target.value)} autoComplete="address-level2" required />
        </Field>
        <Field label="Estado">
          <Select value={c.state} onChange={(e) => set('state', e.target.value)} required>
            <option value="">Selecciona</option>
            {[...new Set([...MEXICAN_STATES, ...(c.state ? [c.state] : [])])].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {error && <Alert>{error}</Alert>}
      <Button type="submit" variant="cream" size="lg" className="w-full" disabled={disabled || pending}>
        {pending ? 'Registrando pedido…' : 'Confirmar pedido'}
      </Button>
    </form>
  );
}
