import { AtSign, CircleHelp, MessageCircle, PackageSearch } from 'lucide-react';
import Link from 'next/link';
import { whatsappLink } from '@/lib/utils/whatsapp';
import type { StoreConfig } from '@/models/types';

export function Footer({ config }: { config: StoreConfig }) {
  const igUrl = config.instagramUrl || `https://www.instagram.com/${config.instagram.replace(/^@/, '')}`;
  return (
    <footer className="border-t border-dashed border-cork bg-walnut">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.06em]">{config.name}</p>
          <p className="mt-2 text-xs text-sand">{config.tagline}</p>
          <p className="mt-1 text-xs text-sand">{config.notes}</p>
        </div>
        <div className="space-y-2 text-xs">
          <p className="text-[10px] uppercase tracking-[0.14em] text-sand">Contacto</p>
          <a href={whatsappLink(config.whatsapp, '¡Hola! Tengo una pregunta.')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-ember">
            <MessageCircle className="size-4" /> {config.whatsapp}
          </a>
          {config.instagram && (
            <a href={igUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-ember">
              <AtSign className="size-4" /> {config.instagram}
            </a>
          )}
        </div>
        <div className="space-y-2 text-xs">
          <p className="text-[10px] uppercase tracking-[0.14em] text-sand">Tu pedido</p>
          <Link href="/rastreo" className="flex items-center gap-2 hover:text-ember">
            <PackageSearch className="size-4" /> Rastrear pedido
          </Link>
          <Link href="/ayuda" className="flex items-center gap-2 hover:text-ember">
            <CircleHelp className="size-4" /> Guía para clientes
          </Link>
        </div>
      </div>
      <p className="border-t border-dashed border-cork py-4 text-center text-[10px] uppercase tracking-[0.1em] text-drift">
        © {new Date().getFullYear()} {config.name}
      </p>
    </footer>
  );
}
