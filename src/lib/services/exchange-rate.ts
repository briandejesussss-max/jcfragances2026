import 'server-only';

/** Tipo de cambio MXN por USD, cacheado un día en el servidor. Devuelve 0 si no se pudo consultar. */
export async function getUsdRate(): Promise<number> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { next: { revalidate: 86400, tags: ['usd-rate'] } });
    if (!res.ok) return 0;
    const data = (await res.json()) as { rates?: Record<string, number> };
    const rate = Number(data?.rates?.MXN);
    return Number.isFinite(rate) && rate > 0 ? Math.round(rate * 100) / 100 : 0;
  } catch {
    return 0;
  }
}
