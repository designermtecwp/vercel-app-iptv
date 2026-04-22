"use client";
import { fetchXtream } from "@/lib/fetch-proxy";
import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { addFavorite, removeFavorite, isFavorite } from "@/lib/favorites";

interface Episode { id:number; title:string; episode_num:number; season:number; info?:{plot?:string;duration_secs?:number}; }
interface SeriesInfo {
  info: {
    name?:string; plot?:string; cast?:string; director?:string;
    releaseDate?:string; rating?:string; cover?:string; backdrop_path?:string;
    genre?:string; episode_run_time?:string;
  };
  episodes?: {[season:string]: {[ep:string]: Episode}};
}

function getEpProgress(epId: number): number {
  try {
    const saved = JSON.parse(localStorage.getItem(`iptv_progress_series_${epId}`) || "null");
    if (saved && saved.duration && saved.time) {
      return Math.min(100, (saved.time / saved.duration) * 100);
    }
  } catch {}
  return 0;
}

function proxyUrl(url: string | undefined | null): string {
  if (!url || typeof url !== "string") return "";
  if (url.startsWith("http://")) return `/api/img?url=${encodeURIComponent(url)}`;
  return url;
}

function SeriesDetail() {
  const { id } = useParams();
  const params = useSearchParams();
  const dns = params.get("dns") || "";
  const username = params.get("username") || "";
  const password = params.get("password") || "";
  const name = params.get("name") || "Série";
  const [info, setInfo] = useState<SeriesInfo | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [loading, setLoading] = useState(true);
  const [fav, setFav] = useState(false);
  const [imgError, setImgError] = useState(false);
  const favId = `series-${id}`;

  useEffect(() => {
    setFav(isFavorite(favId));
    if (!dns) { setLoading(false); return; }
    fetch(`/api/proxy?url=${encodeURIComponent(`${dns}/player_api.php?username=${username}&password=${password}&action=get_series_info&series_id=${id}`)}`)
      .then(r => r.json())
      .then(data => { setInfo(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id, dns, username, password, favId]);

  function toggleFav() {
    if (fav) { removeFavorite(favId); setFav(false); }
    else { addFavorite({ id: favId, type: "series", name: info?.info?.name||name, stream_id: Number(id), icon: info?.info?.cover, addedAt: Date.now() }); setFav(true); }
  }

  const i = info?.info;
  const title = i?.name || name;
  const plot = i?.plot;
  const cast = i?.cast;
  const director = i?.director;
  const year = i?.releaseDate?.slice(0,4);
  const rating = i?.rating && Number(i.rating) > 0 ? Number(i.rating).toFixed(1) : null;
  const cover = i?.cover;
  const backdrop = !imgError ? (i?.backdrop_path || cover) : cover;
  const genre = i?.genre;
  const genres = genre?.split(",").map(g=>g.trim()).filter(Boolean) || [];

  // Processar temporadas e episódios
  const seasons = info?.episodes ? Object.keys(info.episodes).sort((a,b)=>Number(a)-Number(b)) : [];
  const seasonCount = seasons.length;

  const episodes: Episode[] = (() => {
    if (!info?.episodes || seasons.length === 0) return [];
    const seasonKey = seasons[selectedSeason - 1];
    if (!seasonKey) return [];
    const season = info.episodes[seasonKey];
    if (!season) return [];
    return Object.values(season).sort((a,b) => (a.episode_num||0) - (b.episode_num||0));
  })();

  function playEpisode(ep: Episode, idx: number) {
    const nextEp = episodes[idx + 1];
    const p = new URLSearchParams({
      stream: String(ep.id),
      dns, username, password,
      name: ep.title || `S${seasons[selectedSeason-1]}E${ep.episode_num}`,
      type: "series",
      series_id: String(id),
      series_name: title,
      icon: info?.info?.cover || "",
    });
    if (nextEp) {
      p.set("next_ep_id", String(nextEp.id));
      p.set("next_ep_title", nextEp.title || `Ep ${nextEp.episode_num}`);
    }
    window.location.href = `/player?${p.toString()}`;
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="relative bg-black overflow-x-hidden" style={{minHeight:"100%"}}>
      {/* Full backdrop */}
      {backdrop && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img src={proxyUrl(backdrop||"")} alt="" className="w-full h-full object-cover"
            onError={()=>setImgError(true)}/>
          <div className="absolute inset-0" style={{background:"linear-gradient(to right, rgba(0,0,0,0.97) 35%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.4) 100%)"}}/>
          <div className="absolute inset-0" style={{background:"linear-gradient(to top, rgba(0,0,0,0.99) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.7) 100%)"}}/>
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 p-6">
        <Link href="/series" className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors border border-white/10">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </Link>
        <span className="text-xs text-white/40 uppercase tracking-widest font-medium">Série</span>
      </div>

      {/* Hero info */}
      <div className="relative z-10 flex flex-col lg:flex-row gap-8 px-6 pb-8 pt-2 max-w-5xl">
        {/* Poster */}
        <div className="flex-shrink-0">
          <div className="w-40 h-60 rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10 bg-zinc-900 relative">
            {cover
              ?<img src={proxyUrl(cover||"")} alt={title} className="w-full h-full object-cover"/>
              :<div className="w-full h-full flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-10 h-10 text-zinc-700" fill="none" stroke="currentColor" strokeWidth={1}><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 3l-4 4-4-4"/></svg>
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
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-white mb-3 leading-tight tracking-tight">{title}</h1>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {year&&<span className="text-sm text-white/60 font-medium">{year}</span>}
            {seasonCount > 0 && <>
              <span className="text-white/20">·</span>
              <span className="text-sm text-white/60">{seasonCount} temporada{seasonCount!==1?"s":""}</span>
            </>}
            {genres.length>0&&<>
              <span className="text-white/20">·</span>
              <div className="flex flex-wrap gap-1.5">
                {genres.slice(0,3).map(g=>(
                  <span key={g} className="text-xs bg-white/10 text-white/70 px-2.5 py-1 rounded-full border border-white/10">{g}</span>
                ))}
              </div>
            </>}
          </div>
          {plot&&plot.length>5&&<p className="text-white/70 text-sm leading-relaxed mb-5 max-w-xl line-clamp-3">{plot}</p>}
          {(director||cast)&&(
            <div className="space-y-2 mb-6 max-w-xl">
              {director&&<div className="flex gap-3"><span className="text-xs text-white/30 uppercase tracking-wider w-16 flex-shrink-0 pt-0.5">Direção</span><span className="text-sm text-white/60">{director}</span></div>}
              {cast&&<div className="flex gap-3"><span className="text-xs text-white/30 uppercase tracking-wider w-16 flex-shrink-0 pt-0.5">Elenco</span><span className="text-sm text-white/60 line-clamp-2">{cast}</span></div>}
            </div>
          )}
          <button onClick={toggleFav}
            className={`flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl border transition-all ${fav?"bg-red-500/20 border-red-500/40 text-red-400":"bg-white/8 border-white/15 text-white/70 hover:bg-white/12 hover:text-white"}`}>
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill={fav?"currentColor":"none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            {fav?"Favoritado":"Favoritar"}
          </button>
        </div>
      </div>

      {/* Episodes section */}
      <div className="relative z-10 px-6 pb-12">
        {seasonCount > 0 && (
          <>
            {/* Season tabs */}
            <div className="flex gap-2 mb-5 overflow-x-auto hide-scrollbar pb-1">
              {seasons.map((s, idx) => (
                <button key={s} onClick={()=>setSelectedSeason(idx+1)}
                  className={`flex-shrink-0 text-xs font-medium px-4 py-2 rounded-full border transition-all ${selectedSeason===idx+1?"bg-violet-600 border-violet-600 text-white":"border-white/10 text-white/50 hover:text-white hover:border-white/20 bg-white/5"}`}>
                  Temporada {s}
                </button>
              ))}
            </div>

            {/* Episodes grid */}
            {episodes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {episodes.map((ep) => (
                  <button key={ep.id} onClick={()=>playEpisode(ep, episodes.indexOf(ep))}
                    className="flex items-center gap-3 p-3 bg-white/5 border border-white/8 rounded-xl hover:bg-white/10 hover:border-violet-500/50 transition-all text-left group">
                    <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-600/20 transition-colors border border-white/5">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-zinc-500 group-hover:text-violet-400 transition-colors" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{ep.title||`Episódio ${ep.episode_num}`}</p>
                      <p className="text-xs text-white/40 mt-0.5">S{seasons[selectedSeason-1]} · E{ep.episode_num}</p>
                      {(()=>{const prog=getEpProgress(ep.id); return prog>0?(
                        <div className="mt-1.5 h-1 bg-zinc-700 rounded-full overflow-hidden w-full">
                          <div className="h-full bg-violet-500 rounded-full" style={{width:`${prog}%`}}/>
                        </div>
                      ):null;})()}
                    </div>
                    {(()=>{const prog=getEpProgress(ep.id); return prog>=95?(
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M20 6L9 17l-5-5"/></svg>
                    ):(
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-zinc-600 group-hover:text-violet-400 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>
                    );})()}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-white/30">Nenhum episódio nesta temporada</p>
              </div>
            )}
          </>
        )}

        {seasonCount === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-sm text-white/30">Episódios não disponíveis</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SeriesPage() {
  return <Suspense><SeriesDetail/></Suspense>;
}
