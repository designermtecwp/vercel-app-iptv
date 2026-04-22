export interface FavoriteItem {
  id: string;
  type: "live" | "vod" | "series";
  name: string;
  icon?: string;
  stream_id?: number;
  series_id?: number;
  addedAt: number;
}

export function getFavorites(): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("iptv_favorites") || "[]"); } catch { return []; }
}

export function addFavorite(item: FavoriteItem) {
  const favs = getFavorites();
  if (!favs.find(f => f.id === item.id)) {
    localStorage.setItem("iptv_favorites", JSON.stringify([item, ...favs]));
  }
}

export function removeFavorite(id: string) {
  const favs = getFavorites().filter(f => f.id !== id);
  localStorage.setItem("iptv_favorites", JSON.stringify(favs));
}

export function isFavorite(id: string): boolean {
  return getFavorites().some(f => f.id === id);
}
