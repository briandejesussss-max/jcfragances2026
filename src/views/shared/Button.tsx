import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type Variant = 'primary' | 'cream' | 'ghost' | 'danger' | 'whatsapp' | 'link';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'btn-primary bg-bark text-cream hover:bg-cork',
  cream: 'btn-cream bg-cream text-walnut hover:bg-sand',
  ghost: 'border border-cream/80 text-cream hover:bg-bark',
  danger: 'border border-bad/60 text-bad hover:bg-bad/10',
  whatsapp: 'bg-whatsapp text-walnut hover:brightness-110',
  link: 'underline underline-offset-4 text-sand hover:text-cream',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[11px]',
  md: 'px-5 py-2.5 text-xs',
  lg: 'px-6 py-3.5 text-sm',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-pill font-medium uppercase tracking-[0.04em] transition disabled:cursor-not-allowed disabled:opacity-40',
    variant !== 'link' && SIZES[size],
    VARIANTS[variant],
    extra,
  );
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = 'primary', size = 'md', className, type = 'button', ...rest }: Props) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}
