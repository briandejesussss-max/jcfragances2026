import Link from 'next/link';
import { buttonClass } from '@/views/shared/Button';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-3xl">✦</p>
      <h1 className="mt-3 text-2xl">No encontramos esta página</h1>
      <p className="mt-2 text-sm text-sand">Puede que la fragancia ya no esté en el catálogo.</p>
      <Link href="/#catalogo" className={buttonClass('primary', 'md', 'mt-6')}>
        Ver catálogo
      </Link>
    </div>
  );
}
