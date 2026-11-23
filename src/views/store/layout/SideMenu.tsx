'use client';

import Link from 'next/link';
import { Heart, KeyRound, PackageSearch, Sparkles, X } from 'lucide-react';
import { useEffect } from 'react';
import type { Currency } from '@/models/types';
import { Select } from '@/views/shared/Field';
import { useCatalogFilter } from '../state/CatalogFilterContext';
import { useStore } from '../state/StoreProvider';

/** Menú lateral: armario, test olfativo, rendimiento por frasco, moneda, rastreo y acceso del propietario. */
export function SideMenu() {
  const { menuOpen, setMenuOpen, shelf, currency, setCurrency, sizes, config } = useStore();
  const { showInCatalog } = useCatalogFilter();

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen, setMenuOpen]);

  if (!menuOpen) return null;
  const close = () => setMenuOpen(false);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Centro de control">
      <button type="button" aria-label="Cerrar menú" className="absolute inset-0 bg-black/60" onClick={close} />
      <aside className="animate-fade-in absolute inset-y-0 left-0 flex w-[min(22rem,88vw)] flex-col overflow-y-auto border-r border-dashed border-cork bg-walnut p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base">Centro de control</h2>
          <button type="button" onClick={close} aria-label="Cerrar" className="rounded-full p-1.5 text-sand hover:bg-bark">
            <X className="size-5" />
          </button>
        </div>

        <Section title="Tu armario">
          <MenuButton
            icon={<Heart className="size-4" />}
            onClick={() => {
              close();
              document.getElementById('para-ti')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Mi armario de fragancias <span className="ml-auto rounded-full bg-bark px-2 text-[10px]">{shelf.length}</span>
          </MenuButton>
          <MenuButton
            icon={<Sparkles className="size-4" />}
            onClick={() => {
              close();
              showInCatalog({ query: 'Vainilla' });
            }}
          >
            Test de perfil olfativo
          </MenuButton>
        </Section>

        <Section title="Rendimiento por frasco">
          <div className="grid grid-cols-2 gap-1.5 text-center text-[11px]">
            {sizes.map((s) => (
              <div key={s.key} className="rounded-lg bg-bark/60 p-1.5">
                <span className="block text-sand">{s.label}</span>
                <strong className="font-medium">{s.kind === 'parcial' ? 'Parcial' : s.kind === 'pieza' ? 'Pieza' : `~${Math.round(s.ml * 15)} sprays`}</strong>
              </div>
            ))}
            <div className="rounded-lg bg-bark/60 p-1.5">
              <span className="block text-sand">Botella</span>
              <strong className="font-medium">Completa</strong>
            </div>
          </div>
        </Section>

        <Section title="Preferencias">
          <label className="block text-xs text-sand">
            Moneda
            <Select className="mt-1" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
              <option value="MXN">$ MXN</option>
              <option value="USD">USD $</option>
            </Select>
          </label>
        </Section>

        <Section title="Pedidos">
          <MenuLink href="/rastreo" icon={<PackageSearch className="size-4" />} onClick={close}>
            Rastrear mi pedido
          </MenuLink>
        </Section>

        <div className="mt-auto space-y-3 pt-6">
          <p className="text-[11px] text-drift">{config.notes}</p>
          <MenuLink href="/admin" icon={<KeyRound className="size-4" />} onClick={close}>
            Acceso propietario
          </MenuLink>
        </div>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 space-y-2 border-t border-dashed border-cork pt-4">
      <h3 className="text-[10px] tracking-[0.14em] text-sand">{title}</h3>
      {children}
    </section>
  );
}

const itemClass = 'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs uppercase tracking-[0.04em] hover:bg-bark';

function MenuButton({ icon, children, onClick }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={itemClass}>
      {icon}
      {children}
    </button>
  );
}

function MenuLink({ href, icon, children, onClick }: { href: string; icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className={itemClass}>
      {icon}
      {children}
    </Link>
  );
}
