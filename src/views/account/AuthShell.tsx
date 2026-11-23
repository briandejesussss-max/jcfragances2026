import type { ReactNode } from 'react';

/** Marco de las pantallas de acceso (registro, entrar, recuperar). */
export function AuthShell({ eyebrow, title, accent, intro, children, footer }: { eyebrow?: string; title: string; accent?: string; intro?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-10 sm:py-14">
      {eyebrow && <p className="text-[10px] uppercase tracking-[0.14em] text-sand">{eyebrow}</p>}
      <h1 className="text-[clamp(1.9rem,7vw,2.4rem)]">
        {title} {accent && <span className="text-ember">{accent}</span>}
      </h1>
      {intro && <div className="text-sm leading-relaxed text-sand">{intro}</div>}
      {children}
      {footer && <div className="border-t border-dashed border-cork pt-4 text-center text-sm text-sand">{footer}</div>}
    </div>
  );
}

export function Divider({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.1em] text-sand">
      <span className="flex-1 border-t border-dashed border-cork" />
      {children}
      <span className="flex-1 border-t border-dashed border-cork" />
    </div>
  );
}
