import Link from 'next/link';
import { Lock } from 'lucide-react';
import { buttonClass } from '@/views/shared/Button';

/** Un cliente con sesión intenta abrir el panel del propietario. */
export function NotAuthorized() {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-5 px-4 py-20 text-center">
      <div className="grid size-22 place-items-center rounded-full border border-dashed border-cork text-bad">
        <Lock className="size-9" strokeWidth={1.5} />
      </div>
      <h1 className="text-3xl">No autorizado</h1>
      <p className="text-sm leading-relaxed text-sand">Este espacio es solo para el propietario de la tienda. Tu cuenta de cliente sirve para seguir tus pedidos.</p>
      <Link href="/cuenta" className={buttonClass('cream', 'lg', 'w-full')}>
        Ir a mis pedidos
      </Link>
      <Link href="/" className="text-xs text-sand underline underline-offset-4">
        Volver a la tienda
      </Link>
    </div>
  );
}
