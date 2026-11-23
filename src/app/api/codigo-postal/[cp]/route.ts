import { NextResponse } from 'next/server';
import { lookupZip } from '@/models/domain/address';

/** Controlador HTTP: consulta de código postal para el formulario de envío (cacheada 30 días en la CDN). */
export async function GET(_req: Request, { params }: { params: Promise<{ cp: string }> }) {
  const { cp } = await params;
  if (!/^\d{5}$/.test(cp)) return NextResponse.json({ error: 'C.P. no válido' }, { status: 400 });
  const info = await lookupZip(cp);
  if (!info) return NextResponse.json({ error: 'No encontrado' }, { status: 404, headers: { 'Cache-Control': 'public, s-maxage=3600' } });
  return NextResponse.json(info, { headers: { 'Cache-Control': 'public, s-maxage=2592000, stale-while-revalidate=86400' } });
}
