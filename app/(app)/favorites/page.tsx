"use client";
import { useEffect, useState } from "react";
import { getFavorites, removeFavorite, FavoriteItem } from "@/lib/favorites";
import Link from "next/link";

export default function FavoritesPage() {
  const [favs, setFavs] = useState<FavoriteItem[]>([]);
  const [creds, setCreds] = useState<{dns:string;user:string;pass:string}|null>(null);

  useEffect(() => {
    setFavs(getFavorites());
    const dns = localStorage.getItem("xtream_dns");
    const user = localStorage.getItem("xtream_user");
    const pass = localStorage.getItem("xtream_pass");
    if (dns && user && pass) setCreds({dns,user,pass});
  }, []);

  function remove(id: string) {
    removeFavorite(id);
    setFavs(getFavorites());
  }

  function openItem(fav: FavoriteItem) {
    if (!creds) return;
    const url = `/player?stream=${fav.stream_id}&dns=${encodeURIComponent(creds.dns)}&username=${creds.user}&password=${creds.pass}&name=${encodeURIComponent(fav.name)}&type=${fav.type}`;
    window.location.href = url;
  }

  return (
    <div className="p-3 sm:p-6">
      <h1 className="text-xl font-semibold text-white mb-6">Favoritos</h1>
      {favs.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          </div>
          <p className="text-sm text-zinc-500 mb-2">Nenhum favorito ainda</p>
          <p className="text-xs text-zinc-600">Marque conteúdos com ★ no player para salvá-los aqui</p>
        </div>
      ) : (
        <div className="space-y-2">
          {favs.map(fav => (
            <div key={fav.id} className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-600 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {fav.icon
                  ? <img src={fav.icon} alt={fav.name} className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display="none"}}/>
                  : <svg viewBox="0 0 24 24" className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>}
              </div>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={()=>openItem(fav)}>
                <p className="text-sm font-medium text-white truncate">{fav.name}</p>
                <p className="text-xs text-zinc-500 capitalize">{fav.type === "live" ? "Canal ao vivo" : fav.type === "vod" ? "Filme" : "Série"}</p>
              </div>
              <button onClick={()=>remove(fav.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
