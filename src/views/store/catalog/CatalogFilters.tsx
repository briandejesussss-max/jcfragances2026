'use client';

import { Search } from 'lucide-react';
import { GENDER_OPTIONS, SORT_OPTIONS, type CatalogFilter, type SortOrder } from '@/models/domain/catalog';
import { Select, controlClass } from '@/views/shared/Field';
import { cn } from '@/lib/utils/cn';

interface Props {
  filter: CatalogFilter;
  brands: string[];
  onChange: (patch: Partial<CatalogFilter>) => void;
}

export function CatalogFilters({ filter, brands, onChange }: Props) {
  return (
    <div className="space-y-2.5 rounded-3xl border border-cork bg-umber p-3 sm:p-4">
      <label className="relative block">
        <span className="sr-only">Buscar fragancia</span>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-drift" />
        <input
          type="search"
          value={filter.query}
          onChange={(e) => onChange({ query: e.target.value })}
          placeholder="Busca por nombre, casa o nota (vainilla, oud, cítricos…)"
          className={cn(controlClass, 'rounded-pill py-2.5 pl-10')}
        />
      </label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Select aria-label="Casa" value={filter.brand} onChange={(e) => onChange({ brand: e.target.value })}>
          <option value="ALL">Todas las casas</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </Select>
        <Select aria-label="Categoría" value={filter.gender} onChange={(e) => onChange({ gender: e.target.value })}>
          <option value="ALL">Todas las categorías</option>
          {GENDER_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </Select>
        <Select aria-label="Ordenar" value={filter.sort} onChange={(e) => onChange({ sort: e.target.value as SortOrder })}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
