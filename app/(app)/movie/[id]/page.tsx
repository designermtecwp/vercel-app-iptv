"use client";
import { fetchXtream } from "@/lib/fetch-proxy";
import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { addFavorite, removeFavorite, isFavorite } from "@/lib/favorites";

interface MovieInfo {
  info: {
    name?: string; description?: string; genre?: string; cast?: string;
    director?: string; releasedate?: string; rating?: string; duration?: string;
    movie_image?: string; backdrop_path?: string[];
    tmdb_id?: number; youtube_trailer?: string;
  };
}

function MovieDetail() {
  const { id } = useParams();
  const params = useSearchParams();
  const dns = params.get("dns") || "";
  const username = params.get("username") || "";
  const password = params.get("password") || "";
  const name = params.get("name") || "Filme";
  const [info, setInfo] = useState<MovieInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [fav, setFav] = useState(false);
  const [imgError, setImgError] = useState(false);
  const favId = `vod-${id}`;

  useEffect(() => {
    setFav(isFavorite(favId));
    if (!dns) { setLoading(false); return; }
    fetch(`/api/proxy?url=${encodeURIComponent(`${dns}/player_api.php?username=${username}&password=${password}&action=get_vod_info&vod_id=${id}`)}`)
      .then(r => r.json())
      .then(data => { setInfo(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id, dns, username, password, favId]);

  function toggleFav() {
    if (fav) { removeFavorite(favId); setFav(false); }
    else { addFavorite({ id: favId, type: "vod", name: info?.info?.name || name, stream_id: Number(id), icon: poster, addedAt: Date.now() }); setFav(true); }
  }

  const categoryId = params.get("category_id") || "";
  const playerUrl = `/player?stream=${id}&dns=${encodeURIComponent(dns)}&username=${username}&password=${password}&name=${encodeURIComponent(info?.info?.name || name)}&type=vod&category_id=${categoryId}`;

  const i = info?.info;
  const title = i?.name || name;
  const desc = i?.description;
  const genre = i?.genre;
  const cast = i?.cast;
  const director = i?.director;
  const year = i?.releasedate?.slice(0,4);
  const rating = i?.rating && Number(i.rating) > 0 ? Number(i.rating).toFixed(1) : null;
  const duration = i?.duration && i.duration !== "00:00:00" ? i.duration : null;
  const poster = i?.movie_image;
  const backdrop = (!imgError && i?.backdrop_path?.[0]) || poster;

  const genres = genre?.split(",").map(g=>g.trim()).filter(Boolean) || [];

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="relative bg-black overflow-hidden" style={{minHeight:"100%"}}>
      {/* Full backdrop */}
      {backdrop && (
        <div className="absolute inset-0 z-0">
          <img src={backdrop} alt="" className="w-full h-full object-cover"
            onError={()=>setImgError(true)}/>
          <div className="absolute inset-0" style={{background:"linear-gradient(to right, rgba(0,0,0,0.97) 35%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.4) 100%)"}}/>
          <div className="absolute inset-0" style={{background:"linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.7) 100%)"}}/>
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 p-6">
        <Link href="/movies" className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors border border-white/10">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </Link>
        <span className="text-xs text-white/40 uppercase tracking-widest font-medium">Filme</span>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col lg:flex-row gap-10 px-6 pb-12 pt-4 max-w-6xl">
        {/* Poster */}
        <div className="flex-shrink-0">
          <div className="w-48 h-72 rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10 bg-zinc-900 relative">
            {poster
              ? <img src={poster} alt={title} className="w-full h-full object-cover"/>
              : <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                  <svg viewBox="0 0 24 24" className="w-12 h-12 text-zinc-700" fill="none" stroke="currentColor" strokeWidth={1}><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M8 5v14l11-7z" fill="currentColor" stroke="none" className="text-zinc-800"/></svg>
                </div>}
            {rating && (
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-amber-400 text-xs font-bold px-2 py-1 rounded-lg border border-amber-500/20">
                <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>
                {rating}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h1 className="text-4xl font-bold text-white mb-3 leading-tight tracking-tight">{title}</h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {year && <span className="text-sm text-white/60 font-medium">{year}</span>}
            {duration && <>
              <span className="text-white/20">·</span>
              <span className="text-sm text-white/60">{duration}</span>
            </>}
            {genres.length > 0 && <>
              <span className="text-white/20">·</span>
              <div className="flex flex-wrap gap-1.5">
                {genres.slice(0,4).map(g => (
                  <span key={g} className="text-xs bg-white/10 text-white/70 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-sm">{g}</span>
                ))}
              </div>
            </>}
          </div>

          {/* Synopsis */}
          {desc && desc.length > 5 && (
            <div className="mb-6 max-w-xl">
              <p className="text-white/70 text-sm leading-relaxed line-clamp-4">{desc}</p>
            </div>
          )}

          {/* Cast/Director */}
          {(director || cast) && (
            <div className="space-y-2 mb-8 max-w-xl">
              {director && (
                <div className="flex gap-3 items-start">
                  <span className="text-xs text-white/30 uppercase tracking-wider w-16 flex-shrink-0 pt-0.5">Direção</span>
                  <span className="text-sm text-white/60">{director}</span>
                </div>
              )}
              {cast && (
                <div className="flex gap-3 items-start">
                  <span className="text-xs text-white/30 uppercase tracking-wider w-16 flex-shrink-0 pt-0.5">Elenco</span>
                  <span className="text-sm text-white/60 line-clamp-2">{cast}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Link href={playerUrl}
              className="flex items-center gap-2.5 bg-white text-black text-sm font-bold px-7 py-3.5 rounded-xl hover:bg-zinc-100 transition-all hover:scale-[1.02] shadow-lg shadow-white/10">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Assistir agora
            </Link>
            <button onClick={toggleFav}
              className={`flex items-center gap-2 text-sm font-medium px-5 py-3.5 rounded-xl border transition-all hover:scale-[1.02] ${fav ? "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/25" : "bg-white/8 border-white/15 text-white/70 hover:bg-white/12 hover:text-white backdrop-blur-sm"}`}>
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill={fav?"currentColor":"none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
              {fav ? "Favoritado" : "Favoritar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MoviePage() {
  return <Suspense><MovieDetail/></Suspense>;
}
