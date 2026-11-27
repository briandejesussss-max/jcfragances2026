'use client';

import Link from 'next/link';
import { ChevronDown, Droplets, MessageCircle, PackageSearch, ShieldCheck, Truck } from 'lucide-react';
import { SHIPPING } from '@/config/store';
import { useStore } from '../state/StoreProvider';
import styles from './ProductView.module.css';

/** Debajo de los precios: envío, qué es un decant y por qué comprar aquí. */
export function PurchaseInfo() {
  const { config, price } = useStore();
  const freeFrom = Number(config.freeShippingFrom) || 0;
  return (
    <div className="space-y-3">
      <p className="flex items-start gap-2 text-xs text-sand">
        <Truck className="mt-0.5 size-4 shrink-0 text-ember" aria-hidden="true" />
        <span>
          Envío a todo México: {price(SHIPPING.base)}
          {freeFrom > 0 && (
            <>
              {' · '}
              <strong className="text-ok">gratis desde {price(freeFrom)}</strong>
            </>
          )}
        </span>
      </p>

      <details className={styles.explainer}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs text-cream">
          <span className="flex items-center gap-2">
            <Droplets className="size-4 text-ember" aria-hidden="true" /> ¿Qué es un decant?
          </span>
          <ChevronDown className={`${styles.chev} size-4 text-sand`} aria-hidden="true" />
        </summary>
        <p className="mt-2 text-xs leading-relaxed text-sand">
          Es una porción del perfume, tomada del frasco y pasada a un atomizador de vidrio de 3, 5 o 10 ml. Sirve para probarlo varios días antes de comprar
          la botella, o para llevarlo en la bolsa. Un decant de 5 ml rinde unas 75 aplicaciones.
        </p>
      </details>

      <ul className="grid grid-cols-2 gap-2 text-xs">
        <Seal icon={<ShieldCheck className="size-4" />} title="Del frasco original" text="Decants tomados de la botella" />
        <Seal icon={<Droplets className="size-4" />} title="Atomizador de vidrio" text="Protege el aroma" />
        <Seal icon={<PackageSearch className="size-4" />} title="Rastreo de tu pedido" text={<Link href="/rastreo" className="underline underline-offset-2">Síguelo aquí</Link>} />
        <Seal icon={<MessageCircle className="size-4" />} title="Te asesoramos" text="Por WhatsApp, antes y después" />
      </ul>
    </div>
  );
}

function Seal({ icon, title, text }: { icon: React.ReactNode; title: string; text: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 rounded-2xl bg-walnut/50 p-2.5">
      <span className="mt-0.5 text-ember" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold leading-tight text-cream">{title}</span>
        <span className="block leading-snug text-sand">{text}</span>
      </span>
    </li>
  );
}
