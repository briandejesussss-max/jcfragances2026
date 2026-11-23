import Image, { type ImageProps } from 'next/image';

const OPTIMIZABLE_HOSTS = new Set(
  [
    (() => {
      try {
        return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname;
      } catch {
        return '';
      }
    })(),
    'images.unsplash.com',
    'placehold.co',
  ].filter(Boolean),
);

/** Optimiza con next/image las fotos de hosts conocidos (Storage, Unsplash); las de otros sitios se sirven tal cual. */
export function canOptimize(src: unknown): boolean {
  if (typeof src !== 'string') return true;
  try {
    return OPTIMIZABLE_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}

export function SmartImage({ alt, ...props }: ImageProps) {
  return <Image alt={alt} {...props} unoptimized={props.unoptimized ?? !canOptimize(props.src)} />;
}
