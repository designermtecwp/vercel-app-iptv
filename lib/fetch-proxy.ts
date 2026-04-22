const memCache = new Map<string, {data:any, ts:number}>();
const TTL = 8 * 60 * 1000;

export async function fetchXtream(url: string): Promise<any> {
  const mem = memCache.get(url);
  if (mem && Date.now() - mem.ts < TTL) return mem.data;

  const res = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`, {
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
  });
  const data = await res.json();

  if (data && !data.error) {
    memCache.set(url, {data, ts: Date.now()});
  }

  return data;
}

export function clearCache() {
  memCache.clear();
}
