import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export const controlClass =
  'w-full rounded-xl border border-cork bg-walnut px-3 py-2 text-sm text-cream placeholder:text-drift focus:border-sand focus:outline-none disabled:opacity-50';

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('mb-1 block text-[10px] font-medium uppercase tracking-[0.08em] text-sand', className)}>{children}</span>;
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClass, 'pr-8', className)} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClass, 'min-h-20', className)} {...rest} />;
}

/** Etiqueta + control, en bloque. */
export function Field({ label, children, hint, className }: { label: ReactNode; children: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <Label>{label}</Label>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-drift">{hint}</span>}
    </label>
  );
}

export function Checkbox({ label, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2 text-xs text-sand', className)}>
      <input type="checkbox" className="size-4 accent-ember" {...rest} />
      {label}
    </label>
  );
}
