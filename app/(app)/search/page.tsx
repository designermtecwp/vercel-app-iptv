"use client";
import { fetchXtream } from "@/lib/fetch-proxy";
import { useState, useEffect } from "react";

interface Channel { stream_id:number; name:string; stream_icon:string; category_id:string; }
interface VodItem { stream_id:number; name:string; stream_icon:string; }
interface SerieItem { series_id:number; name:string; cover:string; }

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [movies, setMovies] = useState<VodItem[]>([]);
  const [series, setSeries] = useState<SerieItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creds, setCreds] = useState<{dns:string;user:string;pass:string}|null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const dns = localStorage.getItem("xtream_dns");
    const user = localStorage.getItem("xtream_user");
    const pass = localStorage.getItem("xtream_pass");
    if (dns && user && pass) setCreds({dns,user,pass});
  }, []);

  // Carregar dados ao digitar pela primeira vez
  useEffect(() => {
    if (!query || dataLoaded || !creds) return;
    setLoading(true);
    Promise.all([
      fetchXtream(`${creds.dns}/player_api.php?username=${creds.user}&password=${creds.pass}&action=get_live_streams`).catch(()=>[]),
      fetchXtream(`${creds.dns}/player_api.php?username=${creds.user}&password=${creds.pass}&action=get_vod_streams`).catch(()=>[]),
      fetchXtream(`${creds.dns}/player_api.php?username=${creds.user}&password=${creds.pass}&action=get_series`).catch(()=>[]),
    ]).then(([chs, vods, srs]) => {
      setChannels(Array.isArray(chs)?chs:[]);
      setMovies(Array.isArray(vods)?vods:[]);
      setSeries(Array.isArray(srs)?srs:[]);
      setDataLoaded(true);
      setLoading(false);
    });
  }, [query, dataLoaded, creds]);

  const q = query.toLowerCase();
  const filteredChannels = q ? channels.filter(c=>c.name.toLowerCase().includes(q)).slice(0,20) : [];
  const filteredMovies = q ? movies.filter(m=>m.name.toLowerCase().includes(q)).slice(0,20) : [];
  const filteredSeries = q ? series.filter(s=>s.name.toLowerCase().includes(q)).slice(0,20) : [];
  const total = filteredChannels.length + filteredMovies.length + filteredSeries.length;

  function openChannel(ch: Channel) {
    if (!creds) return;
    window.location.href = `/player?stream=${ch.stream_id}&dns=${encodeURIComponent(creds.dns)}&username=${creds.user}&password=${creds.pass}&name=${encodeURIComponent(ch.name)}&type=live&icon=${encodeURIComponent(ch.stream_icon||'')}`;
  }
  function openMovie(m: VodItem) {
    if (!creds) return;
    window.location.href = `/movie/${m.stream_id}?dns=${encodeURIComponent(creds.dns)}&username=${creds.user}&password=${creds.pass}&name=${encodeURIComponent(m.name)}`;
  }
  function openSeries(s: SerieItem) {
    if (!creds) return;
    window.location.href = `/series/${s.series_id}?dns=${encodeURIComponent(creds.dns)}&username=${creds.user}&password=${creds.pass}&name=${encodeURIComponent(s.name)}`;
  }

  return (
    <div className="p-3 sm:p-6">
      <h1 className="text-xl font-semibold text-white mb-6">Buscar</h1>

      <div className="relative mb-8 max-w-lg">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input autoFocus type="text" placeholder="Canais, filmes, séries..." value={query}
          onChange={e=>setQuery(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 text-white pl-12 pr-4 py-3.5 rounded-2xl text-sm focus:outline-none focus:border-violet-500 placeholder-zinc-600 transition-colors"/>
        {query && (
          <button onClick={()=>setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        )}
      </div>

      {/* Estado vazio */}
      {!query && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </div>
          <p className="text-sm text-zinc-500">Digite para buscar em todo o catálogo</p>
          {creds && <p className="text-xs text-zinc-600 mt-1">Canais · Filmes · Séries</p>}
        </div>
      )}

      {/* Carregando */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
          <p className="text-xs text-zinc-500">Buscando no catálogo...</p>
        </div>
      )}

      {/* Sem resultados */}
      {!loading && query && total === 0 && dataLoaded && (
        <div className="text-center py-20 text-zinc-600">
          <p className="text-sm">Nenhum resultado para <span className="text-zinc-400">&quot;{query}&quot;</span></p>
        </div>
      )}

      {/* Resultados */}
      {!loading && total > 0 && (
        <div className="space-y-8">

          {/* Canais */}
          {filteredChannels.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                Canais ao vivo <span className="text-zinc-600">({filteredChannels.length})</span>
              </h2>
              <div className="space-y-1.5">
                {filteredChannels.map(ch=>(
                  <div key={ch.stream_id} onClick={()=>openChannel(ch)}
                    className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-violet-600 cursor-pointer transition-colors group">
                    <div className="w-12 h-9 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {ch.stream_icon
                        ?<img src={ch.stream_icon} alt="" className="w-full h-full object-contain" onError={e=>{(e.target as HTMLImageElement).style.display="none"}}/>
                        :<span className="text-[10px] font-bold text-zinc-600">{ch.name.slice(0,3).toUpperCase()}</span>}
                    </div>
                    <p className="flex-1 text-sm text-white truncate">{ch.name}</p>
                    <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded uppercase font-medium flex-shrink-0">LIVE</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Filmes */}
          {filteredMovies.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                Filmes <span className="text-zinc-600">({filteredMovies.length})</span>
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-3">
                {filteredMovies.map((m,i)=>(
                  <div key={m.stream_id} onClick={()=>openMovie(m)} className="cursor-pointer group">
                    <div className="rounded-xl aspect-[2/3] bg-zinc-900 border border-zinc-800 group-hover:border-zinc-600 transition-all overflow-hidden relative"
                      style={{background:!m.stream_icon?["#1a0533","#0a1628","#1a0a0a","#0a1a1a"][i%4]:"#111"}}>
                      {m.stream_icon
                        ?<img src={m.stream_icon} alt={m.name} className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display="none"}}/>
                        :<div className="w-full h-full flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="w-6 h-6 text-zinc-700" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        </div>}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/60">
                        <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#000"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-white truncate mt-1.5">{m.name}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Séries */}
          {filteredSeries.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                Séries <span className="text-zinc-600">({filteredSeries.length})</span>
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-3">
                {filteredSeries.map(s=>(
                  <div key={s.series_id} onClick={()=>openSeries(s)} className="cursor-pointer group">
                    <div className="rounded-xl aspect-[2/3] bg-zinc-900 border border-zinc-800 group-hover:border-zinc-600 transition-all overflow-hidden relative">
                      {s.cover
                        ?<img src={s.cover} alt={s.name} className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display="none"}}/>
                        :<div className="w-full h-full flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="w-6 h-6 text-zinc-700" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 3l-4 4-4-4"/></svg>
                        </div>}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/60">
                        <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#000"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-white truncate mt-1.5">{s.name}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
