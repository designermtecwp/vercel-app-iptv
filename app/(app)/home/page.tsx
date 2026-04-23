"use client";
import { fetchXtream } from "@/lib/fetch-proxy";
import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";

interface Channel { stream_id:number; name:string; stream_icon:string; category_id:string; }
interface VodItem { stream_id:number; name:string; stream_icon:string; category_id:string; }
interface SeriesItem { series_id:number; name:string; cover:string; category_id:string; last_modified?:string; }
interface HistoryItem { id:string; name:string; type:string; stream_id:number; icon?:string; watchedAt:number; progress?:number; duration?:number; }

function getHistory(): HistoryItem[] {
  try { return JSON.parse(localStorage.getItem("iptv_history") || "[]"); } catch { return []; }
}

function NotificationPopup({ message }: { message: string }) {
  const key = +""+
otif_+""++btoa(encodeURIComponent(message)).slice(0,30);
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
  if (url.startsWith("http://")) return +""+/api/img?url=+""++encodeURIComponent(url);
  return url;
}

/* ========== Scroll Row Wrapper com setas ========== */
function ScrollRow({ children, label, linkHref, linkText, count }: {
  children: React.ReactNode;
  label: string;
  linkHref?: string;
  linkText?: string;
  count?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [hovering, setHovering] = useState(false);

  const check = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 10);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => { el.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, [check, children]);

  const scroll = (dir: "left"|"right") => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -el.clientWidth * 0.75 : el.clientWidth * 0.75, behavior: "smooth" });
  };

  return (
    <section
      className="relative"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5 px-5 sm:px-6">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white/90 tracking-tight">{label}</h2>
          {count !== undefined && count > 0 && (
            <span style={{fontSize:"10px",padding:"1px 7px",borderRadius:"20px",background:"rgba(255,255,255,0.04)",color:"#4a4a5a",fontWeight:500}}>{count}</span>
          )}
        </div>
        {linkHref && (
          <Link href={linkHref} className="text-xs font-medium transition-colors" style={{color:"#4a4a5a"}}
            onMouseEnter={e=>{e.currentTarget.style.color="#f0f0f5"}}
            onMouseLeave={e=>{e.currentTarget.style.color="#4a4a5a"}}>
            {linkText || "Ver tudo"} <span style={{marginLeft:"2px"}}>›</span>
          </Link>
        )}
      </div>

      {/* Scroll container */}
      <div className="relative">
        <div ref={ref} className="flex gap-[var(--row-gap)] overflow-x-auto home-row-scroll px-5 sm:px-6 pb-2" style={{scrollbarWidth:"none",msOverflowStyle:"none"}}>
          {children}
        </div>

        {/* Fade esquerda */}
        <div className="hidden md:block absolute left-0 top-0 bottom-0 w-10 pointer-events-none z-10 transition-opacity duration-300"
          style={{background:"linear-gradient(to right, var(--app-bg, #09090b), transparent)", opacity: canLeft ? 1 : 0}} />

        {/* Fade direita */}
        <div className="hidden md:block absolute right-0 top-0 bottom-0 w-10 pointer-events-none z-10 transition-opacity duration-300"
          style={{background:"linear-gradient(to left, var(--app-bg, #09090b), transparent)", opacity: canRight ? 1 : 0}} />

        {/* Seta esquerda */}
        {canLeft && (
          <button onClick={() => scroll("left")}
            className="hidden md:flex absolute left-1.5 top-1/2 -translate-y-1/2 z-20 items-center justify-center transition-all"
            style={{width:32,height:32,borderRadius:"50%",background:"rgba(9,9,11,0.85)",border:"1px solid rgba(255,255,255,0.06)",color:"#f0f0f5",backdropFilter:"blur(12px)",
              opacity:hovering?1:0,cursor:"pointer",boxShadow:"0 4px 16px rgba(0,0,0,0.5)"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        )}

        {/* Seta direita */}
        {canRight && (
          <button onClick={() => scroll("right")}
            className="hidden md:flex absolute right-1.5 top-1/2 -translate-y-1/2 z-20 items-center justify-center transition-all"
            style={{width:32,height:32,borderRadius:"50%",background:"rgba(9,9,11,0.85)",border:"1px solid rgba(255,255,255,0.06)",color:"#f0f0f5",backdropFilter:"blur(12px)",
              opacity:hovering?1:0,cursor:"pointer",boxShadow:"0 4px 16px rgba(0,0,0,0.5)"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}
      </div>
    </section>
  );
}

/* ========== Card Poster (Filmes/Series) ========== */
function PosterCard({ title, image, onClick, index }: { title:string; image:string; onClick:()=>void; index:number }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const accent = ["#7c3aed","#3b82f6","#f59e0b","#ef4444","#10b981","#6366f1","#ec4899","#f97316"][index % 8];
  return (
    <div onClick={onClick} className="cursor-pointer home-card-item flex-shrink-0" style={{width:"clamp(100px, calc(12.5% - 12.25px), 155px)"}}>
      <div className="card-img relative overflow-hidden mb-1.5"
        style={{aspectRatio:"2/3",borderRadius:"var(--card-radius,6px)",background:image?"#111113":accent+"18",
          border:"1px solid rgba(255,255,255,0.03)"}}>
        {image && !error ? (
          <img src={proxyUrl(image)} alt={title}
            className="w-full h-full object-cover"
            style={{opacity:loaded?1:0,transition:"opacity 0.3s ease"}}
            onLoad={()=>setLoaded(true)}
            onError={()=>setError(true)} />
        ) : null}
        {!loaded && !error && image && <div className="absolute inset-0 skeleton-shimmer"/>}
        {(error || !image) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-7 h-7" fill={accent} opacity={0.5}><path d="M8 5v14l11-7z"/></svg>
          </div>
        )}
        {/* Hover overlay */}
        <div className="card-overlay absolute inset-0 flex items-center justify-center"
          style={{background:"linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%)"}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,0.12)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.15)",
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="white"><polygon points="8,5 20,12 8,19"/></svg>
          </div>
        </div>
      </div>
      <p className="card-title text-xs truncate" style={{color:"#8b8b9a",fontWeight:500,paddingLeft:1}}>{title}</p>
    </div>
  );
}

/* ========== Card Canal Live ========== */
function LiveCard({ ch, onClick }: { ch:Channel; onClick:()=>void }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div onClick={onClick} className="cursor-pointer home-card-item flex-shrink-0" style={{width:"clamp(100px, calc(12.5% - 12.25px), 155px)"}}>
      <div className="card-img relative overflow-hidden mb-1.5 flex items-center justify-center"
        style={{height:90,borderRadius:"var(--card-radius,6px)",background:"#111113",
          border:"1px solid rgba(255,255,255,0.03)"}}>
        {ch.stream_icon ? (
          <img src={ch.stream_icon} alt={ch.name}
            className="w-16 h-12 object-contain"
            style={{opacity:loaded?1:0,transition:"opacity 0.3s ease"}}
            onLoad={()=>setLoaded(true)}
            onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
        ) : (
          <span className="text-base font-bold" style={{color:"rgba(255,255,255,0.12)"}}>{ch.name.slice(0,3).toUpperCase()}</span>
        )}
        {/* Live badge */}
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded"
          style={{background:"rgba(239,68,68,0.80)",fontSize:"8px",fontWeight:700,color:"white",letterSpacing:"0.05em",textTransform:"uppercase"}}>
          <div style={{width:4,height:4,borderRadius:"50%",background:"white"}}/>
          LIVE
        </div>
        {/* Hover overlay */}
        <div className="card-overlay absolute inset-0 flex items-center justify-center"
          style={{background:"rgba(0,0,0,0.5)"}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,0.12)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.15)",
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="white"><polygon points="8,5 20,12 8,19"/></svg>
          </div>
        </div>
      </div>
      <p className="card-title text-xs truncate" style={{color:"#8b8b9a",fontWeight:500,paddingLeft:1}}>{ch.name}</p>
    </div>
  );
}

/* ========== Card Historico ========== */
function HistoryCard({ item, onClick, index }: { item:HistoryItem; onClick:()=>void; index:number }) {
  const accent = ["#7c3aed","#3b82f6","#f59e0b","#ef4444","#10b981","#6366f1","#ec4899","#f97316"][index % 8];
  const typeLabel = item.type==="live"?"Canal":item.type==="vod"?"Filme":"Serie";
  return (
    <div onClick={onClick} className="cursor-pointer home-card-item flex-shrink-0" style={{width:"clamp(100px, calc(12.5% - 12.25px), 155px)"}}>
      <div className="card-img relative overflow-hidden mb-1.5 flex items-center justify-center"
        style={{height:80,borderRadius:"var(--card-radius,6px)",background:accent+"12",
          border:"1px solid rgba(255,255,255,0.03)"}}>
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill={accent} opacity={0.7}><path d="M8 5v14l11-7z"/></svg>
        {/* Progress bar */}
        {item.progress && item.duration && item.duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{background:"rgba(255,255,255,0.06)"}}>
            <div style={{height:"100%",width:+""+${Math.min((item.progress/item.duration)*100,100)}%+""+,background:accent,borderRadius:2}}/>
          </div>
        )}
        <div className="card-overlay absolute inset-0 flex items-center justify-center" style={{background:"rgba(0,0,0,0.45)"}}>
          <div style={{width:30,height:30,borderRadius:"50%",background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="white"><polygon points="8,5 20,12 8,19"/></svg>
          </div>
        </div>
      </div>
      <p className="card-title text-xs truncate" style={{color:"#8b8b9a",fontWeight:500,paddingLeft:1}}>{item.name}</p>
      <p className="text-[10px] truncate" style={{color:"#4a4a5a",paddingLeft:1}}>{typeLabel}</p>
    </div>
  );
}


/* ========== HERO SLIDER ========== */
function HeroSlider({ items, creds }: { items:(VodItem|SeriesItem)[]; creds:{dns:string;user:string;pass:string}|null }) {
  const [index, setIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    if (items.length === 0) return;
    const interval = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        setIndex(i => (i+1) % items.length);
        setImgLoaded(false);
        setTransitioning(false);
      }, 350);
    }, 7000);
    return () => clearInterval(interval);
  }, [items.length]);

  const goTo = (i: number) => {
    if (i === index || transitioning) return;
    setTransitioning(true);
    setTimeout(() => { setIndex(i); setImgLoaded(false); setTransitioning(false); }, 350);
  };

  const current = items[index];
  if (!current) {
    return (
      <div className="relative overflow-hidden" style={{height:"clamp(220px, 42vh, 420px)",background:"linear-gradient(135deg,#0d0522 0%,#0a1628 50%,#09090b 100%)"}}>
        <div className="absolute inset-0 flex items-end pb-10 px-5 sm:px-6">
          <div>
            <h1 className="text-xl font-semibold text-white mb-1">Bem-vindo</h1>
            <p className="text-sm" style={{color:"#4a4a5a"}}>Seu conteudo aparecera aqui</p>
          </div>
        </div>
      </div>
    );
  }

  const isVod = "stream_id" in current;
  const imgSrc = isVod ? (current as VodItem).stream_icon : (current as SeriesItem).cover;
  const title = current.name;

  function handlePlay() {
    if (!creds) return;
    if (isVod) {
      const v = current as VodItem;
      window.location.href = +""+/movie/?dns=&username=&password=&name=&category_id=+""+;
    } else {
      const s = current as SeriesItem;
      window.location.href = +""+/series/?dns=&username=&password=&name=+""+;
    }
  }

  return (
    <div className="relative overflow-hidden" style={{height:"clamp(220px, 42vh, 420px)"}}>
      {/* BG Image */}
      <div className="absolute inset-0 transition-opacity duration-500" style={{opacity: transitioning ? 0 : 1}}>
        {imgSrc && (
          <img src={imgSrc} alt="" className="w-full h-full object-cover"
            style={{opacity:imgLoaded?1:0,transition:"opacity 0.5s ease",transform:"scale(1.03)",filter:"blur(1px)"}}
            onLoad={()=>setImgLoaded(true)}
            onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
        )}
        <div className="absolute inset-0" style={{background:"linear-gradient(to right, rgba(9,9,11,0.96) 0%, rgba(9,9,11,0.65) 45%, rgba(9,9,11,0.25) 100%)"}}/>
        <div className="absolute inset-0" style={{background:"linear-gradient(to top, rgba(9,9,11,1) 0%, rgba(9,9,11,0.5) 35%, transparent 70%)"}}/>
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-end pb-8 sm:pb-10 px-5 sm:px-6">
        <div className="flex items-end gap-4 max-w-2xl w-full transition-all duration-400"
          style={{opacity:transitioning?0:1,transform:transitioning?"translateY(10px)":"translateY(0)"}}>
          {/* Mini poster - desktop only */}
          {imgSrc && (
            <div className="hidden md:block flex-shrink-0 overflow-hidden" style={{width:80,aspectRatio:"2/3",borderRadius:6,border:"1px solid rgba(255,255,255,0.06)",boxShadow:"0 8px 30px rgba(0,0,0,0.5)"}}>
              <img src={imgSrc} alt="" className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display="none"}}/>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{color:"#7c3aed"}}>
              {isVod ? "Filme em destaque" : "Serie em destaque"}
            </p>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 truncate" style={{letterSpacing:"-0.01em",lineHeight:1.2}}>
              {title}
            </h2>
            <div className="flex items-center gap-2.5">
              <button onClick={handlePlay}
                className="flex items-center gap-2 font-semibold text-xs transition-all"
                style={{background:"white",color:"black",padding:"8px 20px",borderRadius:6}}
                onMouseEnter={e=>{e.currentTarget.style.background="#e4e4e7"}}
                onMouseLeave={e=>{e.currentTarget.style.background="white"}}>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Assistir
              </button>
              <button onClick={handlePlay}
                className="flex items-center gap-1.5 font-medium text-xs transition-all"
                style={{background:"rgba(255,255,255,0.07)",color:"#e4e4e7",padding:"8px 16px",borderRadius:6,border:"1px solid rgba(255,255,255,0.06)"}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.12)"}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.07)"}}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                Detalhes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dots */}
      {items.length > 1 && (
        <div className="absolute bottom-3 right-5 flex items-center gap-1">
          {items.map((_,i) => (
            <button key={i} onClick={()=>goTo(i)} className="transition-all duration-300"
              style={{width:i===index?18:5,height:5,borderRadius:10,border:"none",cursor:"pointer",
                background:i===index?"#7c3aed":"rgba(255,255,255,0.15)"}}/>
          ))}
        </div>
      )}
    </div>
  );
}


/* ================================================== */
/* =================== HOME PAGE ==================== */
/* ================================================== */
export default function HomePage() {
  const [creds, setCreds] = useState<{dns:string;user:string;pass:string}|null>(null);
  const [adminConfig, setAdminConfig] = useState<{notification?:string;appName?:string;primaryColor?:string}>({});
  const [channels, setChannels] = useState<Channel[]>([]);
  const [movies, setMovies] = useState<VodItem[]>([]);
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sliderItems, setSliderItems] = useState<(VodItem|SeriesItem)[]>([]);

  useEffect(() => {
    const fetchAdmin = () => fetch("/api/admin/public").then(r=>r.json()).then(cfg=>{
      setAdminConfig(cfg);
      if (cfg.primaryColor) {
        const root = document.documentElement;
        root.style.setProperty("--primary", cfg.primaryColor);
        const styleId = "admin-theme";
        let style = document.getElementById(styleId) as HTMLStyleElement;
        if (!style) { style = document.createElement("style"); style.id = styleId; document.head.appendChild(style); }
        style.textContent = +""+
          .bg-violet-600, .hover\\:bg-violet-600:hover { background-color:  !important; }
          .bg-violet-500, .hover\\:bg-violet-500:hover { background-color: dd !important; }
          .text-violet-400, .text-violet-300 { color:  !important; }
          .border-violet-500, .border-violet-600 { border-color:  !important; }
          .bg-violet-600\\/20 { background-color: 33 !important; }
          .ring-violet-400 { --tw-ring-color:  !important; }
        +""+;
      }
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
      Promise.all([
        fetchXtream(+""+${dns}/player_api.php?username=&password=&action=get_live_streams+""+).catch(()=>[]),
        fetchXtream(+""+${dns}/player_api.php?username=&password=&action=get_vod_categories+""+).catch(()=>[]),
        fetchXtream(+""+${dns}/player_api.php?username=&password=&action=get_series_categories+""+).catch(()=>[]),
      ]).then(async ([chs, vodCats, srsCats]) => {
        setChannels(Array.isArray(chs) ? chs.slice(0, 20) : []);
        setLoading(false);

        const vodCatList = Array.isArray(vodCats) ? vodCats : [];
        const srsCatList = Array.isArray(srsCats) ? srsCats : [];
        const firstVodCat = vodCatList[vodCatList.length - 1]?.category_id;
        const firstSrsCat = srsCatList[srsCatList.length - 1]?.category_id;

        const [vods, srs] = await Promise.all([
          firstVodCat
            ? fetchXtream(+""+${dns}/player_api.php?username=&password=&action=get_vod_streams&category_id=+""+).catch(()=>[])
            : Promise.resolve([]),
          firstSrsCat
            ? fetchXtream(+""+${dns}/player_api.php?username=&password=&action=get_series&category_id=+""+).catch(()=>[])
            : Promise.resolve([]),
        ]);

        const vodList = Array.isArray(vods) ? vods : [];
        const srsList = Array.isArray(srs) ? srs : [];
        setMovies(vodList.slice(0, 20));
        setSeries(srsList.slice(0, 20));

        const vodWithCover = vodList.filter((v:VodItem)=>v.stream_icon).slice(0,5);
        const srsWithCover = srsList.filter((s:SeriesItem)=>s.cover).slice(0,5);
        setSliderItems([...vodWithCover, ...srsWithCover].sort(()=>Math.random()-0.5).slice(0,8));
      }).catch(() => { setLoading(false); });
    } else {
      setLoading(false);
    }
    return () => clearInterval(adminInterval);
  }, []);

  function openChannel(ch: Channel) {
    if (!creds) return;
    window.location.href = +""+/player?stream=&dns=&username=&password=&name=&type=live&icon=+""+;
  }
  function openMovie(m: VodItem) {
    if (!creds) return;
    window.location.href = +""+/movie/?dns=&username=&password=&name=&category_id=&icon=+""+;
  }
  function openSeries(s: SeriesItem) {
    if (!creds) return;
    window.location.href = +""+/series/?dns=&username=&password=&name=&icon=+""+;
  }
  function openHistory(item: HistoryItem) {
    if (!creds) return;
    if (item.type === "vod") window.location.href = +""+/movie/?dns=&username=&password=&name=&icon=+""+;
    else if (item.type === "series") window.location.href = +""+/player?stream=&dns=&username=&password=&name=&type=series&icon=+""+;
    else window.location.href = +""+/player?stream=&dns=&username=&password=&name=&type=live&icon=+""+;
  }

  /* === Loading State === */
  if (loading) {
    return (
      <div className="min-h-full" style={{background:"var(--app-bg,#09090b)"}}>
        {/* Hero skeleton */}
        <div className="skeleton-shimmer" style={{height:"clamp(220px, 42vh, 420px)"}}/>
        {/* Row skeletons */}
        <div className="px-5 sm:px-6 mt-6 space-y-8">
          {[1,2,3].map(n => (
            <div key={n}>
              <div className="skeleton-shimmer rounded mb-3" style={{width:140,height:14}}/>
              <div className="flex gap-[var(--row-gap)]">
                {[...Array(8)].map((_,i) => (
                  <div key={i} className="flex-shrink-0 skeleton-shimmer" style={{width:"clamp(100px, calc(12.5% - 12.25px), 155px)",aspectRatio:"2/3",borderRadius:"var(--card-radius,6px)"}}/>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-6" style={{background:"var(--app-bg,#09090b)"}}>
      {/* Notificacao admin */}
      {adminConfig.notification && <NotificationPopup message={adminConfig.notification} />}

      {/* Hero */}
      <HeroSlider items={sliderItems} creds={creds} />

      {/* Content Rows */}
      <div className="mt-4 space-y-6">
        {/* Historico */}
        {history.length > 0 && (
          <ScrollRow label="Assistidos recentemente" count={history.length}>
            {history.map((item, i) => (
              <HistoryCard key={+""+${item.id}-+""+} item={item} onClick={()=>openHistory(item)} index={i} />
            ))}
          </ScrollRow>
        )}

        {/* Canais ao vivo */}
        {channels.length > 0 && (
          <ScrollRow label="Canais ao vivo" linkHref="/channels" linkText="Ver todos" count={channels.length}>
            {channels.map(ch => (
              <LiveCard key={ch.stream_id} ch={ch} onClick={()=>openChannel(ch)} />
            ))}
          </ScrollRow>
        )}

        {/* Filmes */}
        {movies.length > 0 && (
          <ScrollRow label="Ultimos filmes adicionados" linkHref="/movies" linkText="Ver catalogo" count={movies.length}>
            {movies.map((m, i) => (
              <PosterCard key={m.stream_id} title={m.name} image={m.stream_icon} onClick={()=>openMovie(m)} index={i} />
            ))}
          </ScrollRow>
        )}

        {/* Series */}
        {series.length > 0 && (
          <ScrollRow label="Ultimas series adicionadas" linkHref="/series" linkText="Ver catalogo" count={series.length}>
            {series.map((s, i) => (
              <PosterCard key={s.series_id} title={s.name} image={s.cover} onClick={()=>openSeries(s)} index={i} />
            ))}
          </ScrollRow>
        )}
      </div>
    </div>
  );
}
