"use client";
import { fetchXtream } from "@/lib/fetch-proxy";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface Channel { stream_id:number; name:string; stream_icon:string; category_id:string; }
interface VodItem { stream_id:number; name:string; stream_icon:string; category_id:string; }
interface SeriesItem { series_id:number; name:string; cover:string; category_id:string; last_modified?:string; }
interface HistoryItem { id:string; name:string; type:string; stream_id:number; icon?:string; watchedAt:number; progress?:number; duration?:number; }

function getHistory(): HistoryItem[] {
  try { return JSON.parse(localStorage.getItem("iptv_history") || "[]"); } catch { return []; }
}

function NotificationPopup({ message }: { message: string }) {
  const key = `notif_${btoa(encodeURIComponent(message)).slice(0,30)}`;
  const [visible, setVisible] = React.useState(() => {
    try { return localStorage.getItem(key) !== "closed"; } catch { return true; }
  });
  if (!visible) return null;
  function close() {
    try { localStorage.setItem(key, "closed"); } catch {}
    setVisible(false);
  }
  return (
    <div style={{position:"fixed",top:"12px",right:"12px",zIndex:9998,width:"280px",animation:"slideIn 0.3s ease"}}>
      <style>{`@keyframes slideIn{from{transform:translateX(20px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
      <div style={{background:"rgba(15,15,20,0.97)",border:"1px solid rgba(124,58,237,0.4)",borderRadius:"8px",padding:"10px 12px",display:"flex",alignItems:"flex-start",gap:"8px",boxShadow:"0 4px 20px rgba(0,0,0,0.5)"}}>
        <svg viewBox="0 0 24 24" style={{width:"14px",height:"14px",flexShrink:0,marginTop:"2px",color:"#a685ff"}} fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
        <p style={{flex:1,fontSize:"12px",lineHeight:"1.5",color:"#ffffff",margin:0,wordBreak:"break-word",overflowWrap:"anywhere"}}>{message}</p>
        <button onClick={close} style={{background:"none",border:"none",cursor:"pointer",color:"#71717b",padding:"0",flexShrink:0,marginTop:"1px"}}>
          <svg viewBox="0 0 24 24" style={{width:"12px",height:"12px"}} fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
  );
}


function proxyUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://")) return `/api/img?url=${encodeURIComponent(url)}`;
  return url;
}
export default function HomePage() {
  const [creds, setCreds] = useState<{dns:string;user:string;pass:string}|null>(null);
  const [adminConfig, setAdminConfig] = useState<{notification?:string;appName?:string;primaryColor?:string}>({});
  const [channels, setChannels] = useState<Channel[]>([]);
  const [movies, setMovies] = useState<VodItem[]>([]);
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState<"online"|"offline"|"checking">("checking");
  const [sliderIndex, setSliderIndex] = useState(0);
  const [sliderItems, setSliderItems] = useState<(VodItem|SeriesItem)[]>([]);

  useEffect(() => {
    // Buscar config do painel admin e atualizar periodicamente
    const fetchAdmin = () => fetch("/api/admin/public").then(r=>r.json()).then(cfg=>{
      setAdminConfig(cfg);
      // Aplicar cor primária em todas as classes violet/purple do Tailwind via CSS vars
      if (cfg.primaryColor) {
        const root = document.documentElement;
        root.style.setProperty("--primary", cfg.primaryColor);
        // Injetar estilo global para sobrescrever cor violet
        const styleId = "admin-theme";
        let style = document.getElementById(styleId) as HTMLStyleElement;
        if (!style) { style = document.createElement("style"); style.id = styleId; document.head.appendChild(style); }
        style.textContent = `
          .bg-violet-600, .hover\:bg-violet-600:hover { background-color: ${cfg.primaryColor} !important; }
          .bg-violet-500, .hover\:bg-violet-500:hover { background-color: ${cfg.primaryColor}dd !important; }
          .text-violet-400, .text-violet-300 { color: ${cfg.primaryColor} !important; }
          .border-violet-500, .border-violet-600 { border-color: ${cfg.primaryColor} !important; }
          .bg-violet-600\/20 { background-color: ${cfg.primaryColor}33 !important; }
          .ring-violet-400 { --tw-ring-color: ${cfg.primaryColor} !important; }
        `;
      }
      // Aplicar nome do app no título
      if (cfg.appName) document.title = cfg.appName;
    }).catch(()=>{});
    fetchAdmin();
    const adminInterval = setInterval(fetchAdmin, 30000);

    const dns = localStorage.getItem("xtream_dns");
    const user = localStorage.getItem("xtream_user");
    const pass = localStorage.getItem("xtream_pass");
    setHistory(getHistory().slice(0, 8));
    if (dns && user && pass) {
      setCreds({dns, user, pass});
      // Fase 1: canais + categorias (leve e rápido)
      Promise.all([
        fetchXtream(`${dns}/player_api.php?username=${user}&password=${pass}&action=get_live_streams`).catch(()=>[]),
        fetchXtream(`${dns}/player_api.php?username=${user}&password=${pass}&action=get_vod_categories`).catch(()=>[]),
        fetchXtream(`${dns}/player_api.php?username=${user}&password=${pass}&action=get_series_categories`).catch(()=>[]),
      ]).then(async ([chs, vodCats, srsCats]) => {
        setChannels(Array.isArray(chs) ? chs.slice(0, 8) : []);
        setServerStatus("online");
        setLoading(false);

        // Fase 2: buscar filmes e séries de UMA categoria só (muito mais rápido)
        const vodCatList = Array.isArray(vodCats) ? vodCats : [];
        const srsCatList = Array.isArray(srsCats) ? srsCats : [];
        const firstVodCat = vodCatList[vodCatList.length - 1]?.category_id;
        const firstSrsCat = srsCatList[srsCatList.length - 1]?.category_id;

        const [vods, srs] = await Promise.all([
          firstVodCat
            ? fetchXtream(`${dns}/player_api.php?username=${user}&password=${pass}&action=get_vod_streams&category_id=${firstVodCat}`).catch(()=>[])
            : Promise.resolve([]),
          firstSrsCat
            ? fetchXtream(`${dns}/player_api.php?username=${user}&password=${pass}&action=get_series&category_id=${firstSrsCat}`).catch(()=>[])
            : Promise.resolve([]),
        ]);

        const vodList = Array.isArray(vods) ? vods : [];
        const srsList = Array.isArray(srs) ? srs : [];
        setMovies(vodList.slice(0, 10));
        setSeries(srsList.slice(0, 10));

        const vodWithCover = vodList.filter((v:VodItem)=>v.stream_icon).slice(0,5);
        const srsWithCover = srsList.filter((s:SeriesItem)=>s.cover).slice(0,5);
        const mixed = [...vodWithCover, ...srsWithCover].sort(()=>Math.random()-0.5).slice(0,8);
        setSliderItems(mixed);
      }).catch(() => { setServerStatus("offline"); setLoading(false); });
    } else {
      setServerStatus("offline");
      setLoading(false);
    }
  }, []);

  const accentColors = ["#7c3aed","#3b82f6","#f59e0b","#ef4444","#10b981","#6366f1","#ec4899","#f97316"];
  const historyRef = useRef<HTMLDivElement>(null);
  const channelsRef = useRef<HTMLDivElement>(null);
  const moviesRef = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    [historyRef, channelsRef, moviesRef, seriesRef].forEach(ref => {
      const el = ref.current;
      if (!el) return;
      let isDown = false, startX = 0, scrollLeft = 0;
      const onDown = (e: MouseEvent) => { isDown=true; el.style.cursor="grabbing"; startX=e.pageX-el.offsetLeft; scrollLeft=el.scrollLeft; };
      const onUp = () => { isDown=false; el.style.cursor="grab"; };
      const onMove = (e: MouseEvent) => { if(!isDown) return; e.preventDefault(); const x=e.pageX-el.offsetLeft; el.scrollLeft=scrollLeft-(x-startX)*1.5; };
      el.style.cursor="grab";
      el.addEventListener("mousedown",onDown);
      el.addEventListener("mouseleave",onUp);
      el.addEventListener("mouseup",onUp);
      el.addEventListener("mousemove",onMove);
    });
  }, []);

  function openChannel(ch: Channel) {
    if (!creds) return;
    window.location.href = `/player?stream=${ch.stream_id}&dns=${encodeURIComponent(creds.dns)}&username=${creds.user}&password=${creds.pass}&name=${encodeURIComponent(ch.name)}&type=live&icon=${encodeURIComponent(ch.stream_icon||"")}`;
  }
  function openMovie(m: VodItem) {
    if (!creds) return;
    window.location.href = `/movie/${m.stream_id}?dns=${encodeURIComponent(creds.dns)}&username=${creds.user}&password=${creds.pass}&name=${encodeURIComponent(m.name)}&category_id=${m.category_id}&icon=${encodeURIComponent(m.stream_icon||"")}`;
  }
  function openSeries(s: SeriesItem) {
    if (!creds) return;
    window.location.href = `/series/${s.series_id}?dns=${encodeURIComponent(creds.dns)}&username=${creds.user}&password=${creds.pass}&name=${encodeURIComponent(s.name)}&icon=${encodeURIComponent(s.cover||"")}`;
  }
  function openHistory(item: HistoryItem) {
    if (!creds) return;
    if (item.type === "vod") window.location.href = `/movie/${item.stream_id}?dns=${encodeURIComponent(creds.dns)}&username=${creds.user}&password=${creds.pass}&name=${encodeURIComponent(item.name)}&icon=${encodeURIComponent(item.icon||"")}`;
    else if (item.type === "series") window.location.href = `/player?stream=${item.stream_id}&dns=${encodeURIComponent(creds.dns)}&username=${creds.user}&password=${creds.pass}&name=${encodeURIComponent(item.name)}&type=series&icon=${encodeURIComponent(item.icon||"")}`;
    else window.location.href = `/player?stream=${item.stream_id}&dns=${encodeURIComponent(creds.dns)}&username=${creds.user}&password=${creds.pass}&name=${encodeURIComponent(item.name)}&type=live&icon=${encodeURIComponent(item.icon||"")}`;
  }

  useEffect(() => {
    if (sliderItems.length === 0) return;
    const interval = setInterval(() => setSliderIndex(i => (i+1) % sliderItems.length), 5000);
    return () => clearInterval(interval);
  }, [sliderItems.length]);

  const currentSlide = sliderItems[sliderIndex];
  const isVod = currentSlide && "stream_id" in currentSlide;

  return (
    <div className="min-h-full pb-6">
      {/* Notificação admin — popup topo direito */}
      {adminConfig.notification && (
        <NotificationPopup message={adminConfig.notification} />
      )}
      {/* Hero Slider */}
      <div className="relative h-64 sm:h-80 md:h-96 overflow-hidden">
        {currentSlide ? (
          <div className="absolute inset-0 transition-all duration-700">
            <img src={"stream_icon" in currentSlide ? currentSlide.stream_icon : currentSlide.cover} alt=""
              className="w-full h-full object-cover scale-105" style={{filter:"blur(2px)"}}
              onError={e=>{(e.target as HTMLImageElement).style.display="none"}}/>
            <div className="absolute inset-0" style={{background:"linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.2) 100%)"}}/>
            <div className="absolute inset-0" style={{background:"linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)"}}/>
          </div>
        ) : (
          <div className="absolute inset-0" style={{background:"linear-gradient(135deg,#0d0522 0%,#0a1628 50%,#0d0522 100%)"}}/>
        )}
        <div className="absolute inset-0 flex items-end pb-8 px-4 sm:px-8">
          <div className="flex items-end gap-4 w-full max-w-2xl">
            {currentSlide && (
              <div className="hidden sm:block flex-shrink-0 w-24 rounded-xl overflow-hidden border border-white/10 shadow-2xl" style={{aspectRatio:"2/3"}}>
                <img src={"stream_icon" in currentSlide ? currentSlide.stream_icon : currentSlide.cover} alt=""
                  className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display="none"}}/>
              </div>
            )}
            <div className="flex-1 min-w-0">

              {currentSlide ? (
                <>
                  <p className="text-xs text-white/50 font-medium mb-1 uppercase tracking-wider">{isVod?"Filme em destaque":"Série em destaque"}</p>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 truncate">{"name" in currentSlide ? currentSlide.name : ""}</h2>
                  <button onClick={()=>{
                    if(!creds) return;
                    if(isVod){const v=currentSlide as VodItem;window.location.href=`/movie/${v.stream_id}?dns=${encodeURIComponent(creds.dns)}&username=${creds.user}&password=${creds.pass}&name=${encodeURIComponent(v.name)}&category_id=${v.category_id}`;}
                    else{const s=currentSlide as SeriesItem;window.location.href=`/series/${s.series_id}?dns=${encodeURIComponent(creds.dns)}&username=${creds.user}&password=${creds.pass}&name=${encodeURIComponent(s.name)}`;}
                  }} className="flex items-center gap-2 bg-white text-black text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-zinc-200 transition-colors">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    Assistir agora
                  </button>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-semibold text-white mb-1">Bem-vindo</h1>
                  <p className="text-sm text-zinc-400">Conecte um servidor para ver conteúdo</p>
                </>
              )}
            </div>
          </div>
        </div>
        {sliderItems.length > 1 && (
          <div className="absolute bottom-3 right-4 flex items-center gap-1.5">
            {sliderItems.map((_,i)=>(
              <button key={i} onClick={()=>setSliderIndex(i)}
                className={`rounded-full transition-all ${i===sliderIndex?"w-4 h-1.5 bg-white":"w-1.5 h-1.5 bg-white/30 hover:bg-white/60"}`}/>
            ))}
          </div>
        )}
        {sliderItems.length > 1 && (
          <>
            <button onClick={()=>setSliderIndex(i=>(i-1+sliderItems.length)%sliderItems.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/70 transition-colors">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button onClick={()=>setSliderIndex(i=>(i+1)%sliderItems.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/70 transition-colors">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </>
        )}
      </div>

      <div className="px-4 sm:px-6 space-y-8 mt-6">
        {/* Histórico recente — só mostrar se tiver ao menos 3 items */}
        {history.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-white mb-3">Assistidos recentemente</h2>
            <div className="flex gap-2" style={{overflowX:"auto",scrollbarWidth:"none",msOverflowStyle:"none"}}>
              {history.slice(0,8).map((item, i) => (
                <div key={`${item.id}-${i}`} onClick={()=>openHistory(item)} className="cursor-pointer group flex-shrink-0" style={{width:"clamp(100px, calc(12.5% - 7px), 160px)"}}>
                  <div className="relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 group-hover:border-violet-600 transition-all mb-1.5 flex items-center justify-center" style={{height:"80px"}}>
                    <div className="w-full h-full flex items-center justify-center" style={{background:accentColors[i%8]+"22"}}>
                      <svg viewBox="0 0 24 24" className="w-7 h-7" fill={accentColors[i%8]}><path d="M8 5v14l11-7z"/></svg>
                    </div>

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                      <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#000"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-white truncate">{item.name}</p>
                  <p className="text-[10px] text-zinc-500">{item.type==="live"?"Canal ao vivo":item.type==="vod"?"Filme":"Série"}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Canais ao vivo */}
        {(loading || channels.length > 0) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white">Canais ao vivo</h2>
              <Link href="/channels" className="text-xs text-white/60 hover:text-white transition-colors">Ver todos</Link>
            </div>
            {loading ? (
              <div className="flex gap-3">{[...Array(4)].map((_,i)=><div key={i} className="flex-shrink-0 w-40 h-28 bg-zinc-900 rounded-xl animate-pulse"/>)}</div>
            ) : (
              <div className="flex gap-2" style={{overflowX:"auto",scrollbarWidth:"none",msOverflowStyle:"none"}}>
                {channels.slice(0,8).map(ch => (
                  <div key={ch.stream_id} onClick={()=>openChannel(ch)} className="cursor-pointer group flex-shrink-0" style={{width:"clamp(100px, calc(12.5% - 7px), 160px)"}}>
                    <div className="relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 group-hover:border-violet-600 transition-all mb-2 h-24 flex items-center justify-center">

                      {ch.stream_icon
                        ? <img src={ch.stream_icon} alt={ch.name} className="w-16 h-12 object-contain" onError={e=>{(e.target as HTMLImageElement).style.display="none"}}/>
                        : <span className="text-lg font-bold text-white/20">{ch.name.slice(0,3).toUpperCase()}</span>
                      }
                      <div className="absolute bottom-1.5 right-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>
                      </div>
                    </div>
                    <p className="text-xs text-white truncate">{ch.name}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Filmes */}
        {(loading || movies.length > 0) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white">Últimos filmes adicionados</h2>
              <Link href="/movies" className="text-xs text-white/60 hover:text-white transition-colors">Ver catálogo</Link>
            </div>
            {loading ? (
              <div className="flex gap-3">{[...Array(5)].map((_,i)=><div key={i} className="flex-shrink-0 w-28 h-40 bg-zinc-900 rounded-xl animate-pulse"/>)}</div>
            ) : (
              <div className="flex gap-2" style={{overflowX:"auto",scrollbarWidth:"none",msOverflowStyle:"none"}}>
                {movies.slice(0,10).map((m,i) => (
                  <div key={m.stream_id} onClick={()=>openMovie(m)} className="cursor-pointer group flex-shrink-0" style={{width:"clamp(100px, calc(12.5% - 7px), 160px)"}}>
                    <div className="rounded-xl overflow-hidden border border-zinc-800 group-hover:border-violet-600 transition-all mb-1.5 relative"
                      style={{aspectRatio:"2/3", background: m.stream_icon?"#111":accentColors[i%8]+"22"}}>
                      {m.stream_icon
                        ? <img src={proxyUrl(m.stream_icon)} alt={m.name} className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display="none"}}/>
                        : <div className="w-full h-full flex items-center justify-center"><svg viewBox="0 0 24 24" className="w-8 h-8" fill={accentColors[i%8]}><path d="M8 5v14l11-7z"/></svg></div>
                      }
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#000"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-white truncate">{m.name}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Séries */}
        {(loading || series.length > 0) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white">Últimas séries adicionadas</h2>
              <Link href="/series" className="text-xs text-white/60 hover:text-white transition-colors">Ver catálogo</Link>
            </div>
            {loading ? (
              <div className="flex gap-3">{[...Array(5)].map((_,i)=><div key={i} className="flex-shrink-0 w-28 h-40 bg-zinc-900 rounded-xl animate-pulse"/>)}</div>
            ) : (
              <div className="flex gap-2 md:overflow-hidden no-scrollbar" style={{overflowX:"auto"}}>
                {series.slice(0,10).map((s,i) => (
                  <div key={s.series_id} onClick={()=>openSeries(s)} className="cursor-pointer group flex-shrink-0" style={{width:"clamp(100px, calc(10% - 7.2px), 150px)"}}>
                    <div className="rounded-xl overflow-hidden border border-zinc-800 group-hover:border-violet-600 transition-all mb-1.5 relative"
                      style={{aspectRatio:"2/3", background: s.cover?"#111":accentColors[i%8]+"22"}}>
                      {s.cover
                        ? <img src={proxyUrl(s.cover)} alt={s.name} className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display="none"}}/>
                        : <div className="w-full h-full flex items-center justify-center"><svg viewBox="0 0 24 24" className="w-8 h-8" fill={accentColors[i%8]}><path d="M2 2h20v20H2zM7 2v20M17 2v20M2 12h20"/></svg></div>
                      }
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#000"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-white truncate">{s.name}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
