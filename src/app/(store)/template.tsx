import type { ReactNode } from 'react';

/** Se vuelve a montar en cada navegación: la página entra con una transición suave (ver app-feel.css). */
export default function StoreTemplate({ children }: { children: ReactNode }) {
  return <div className="route-enter">{children}</div>;
}
