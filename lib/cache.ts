const store = new Map<string, {data: any, ts: number}>();
const TTL = 5 * 60 * 1000; // 5 minutos

export function getCached(key: string): any | null {
  const item = store.get(key);
  if (!item) return null;
  if (Date.now() - item.ts > TTL) { store.delete(key); return null; }
  return item.data;
}

export function setCached(key: string, data: any) {
  store.set(key, { data, ts: Date.now() });
}
