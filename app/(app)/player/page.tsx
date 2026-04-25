"use client";
import { fetchXtream } from "@/lib/fetch-proxy";
import { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { addFavorite, removeFavorite, isFavorite } from "@/lib/favorites";



function getExternalUrl(player: string, url: string) {
  switch(player) {
    case "vlc": return `vlc://${url}`;
    case "mx": return `intent:${url}#Intent;package=com.mxtech.videoplayer.ad;end`;
    case "infuse": return `infuse://x-callback-url/play?url=${encodeURIComponent(url)}`;
    case "mpv": return `mpv://${url}`;
    default: return null;
  }
}

interface Channel { stream_id:number; name:string; stream_icon:string; category_id:string; }
interface Category { category_id:string; category_name:string; }
interface EpgEntry { title:string; description:string; start:number; end:number; }
interface EpgMap { [stream_id:string]: EpgEntry[] }

function PlayerContent() {
  const params = useSearchParams();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<{ destroy:()=>void; loadSource:(u:string)=>void; attachMedia:(v:HTMLVideoElement)=>void } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [fav, setFav] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [launched, setLaunched] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [guideFilter, setGuideFilter] = useState("all");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [nextEpName, setNextEpName] = useState("");
  const [epgData, setEpgData] = useState<EpgMap>({});
  const [currentEpg, setCurrentEpg] = useState<EpgEntry|null>(null);
  const [nextEpg, setNextEpg] = useState<EpgEntry|null>(null);
  const [epgLoading, setEpgLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRotated, setIsRotated] = useState(false);
  const [showContinue, setShowContinue] = useState(false);
  const [savedTime, setSavedTime] = useState(0);
  const [vodItems, setVodItems] = useState<{stream_id:number;name:string;stream_icon:string;category_id:string}[]>([]);
  const [seriesEps, setSeriesEps] = useState<{id:number;title:string;episode_num:number;season:number}[]>([]);
  const hideTimer = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  const streamId = params.get("stream");
  const dns = params.get("dns");
  const username = params.get("username");
  const password = params.get("password");
  const name = params.get("name") || "Conteúdo";
  const type = params.get("type") || "live";
  const cat = params.get("cat") || "all";
  const seriesId = params.get("series_id");
  const nextEpId = params.get("next_ep_id");
  const nextEpTitle = params.get("next_ep_title");
  const isLive = type === "live" && !!streamId;
  const isSeries = type === "series";

  const backHref = type === "vod"
    ? `/movie/${streamId}?dns=${encodeURIComponent(dns||"")}&username=${username||""}&password=${password||""}&name=${encodeURIComponent(name)}`
    : isSeries && seriesId && dns && username && password
      ? `/series/${seriesId}?dns=${encodeURIComponent(dns)}&username=${username}&password=${password}&name=${encodeURIComponent(params.get("series_name")||"Série")}`
      : "/channels";

  const favId = `${type}-${streamId}`;

  const streamUrl = streamId && dns && username && password
    ? isLive
      ? `${dns}/live/${username}/${password}/${streamId}.m3u8`
      : `${dns}/movie/${username}/${password}/${streamId}.mp4`
    : null;

  useEffect(() => {
    if (streamId) setFav(isFavorite(favId));
    if (cat !== "all") sessionStorage.setItem("channels_last_cat", cat);
    const player = localStorage.getItem("iptv_player") || "internal";
    if (player !== "internal" && streamId) {
      if (!streamUrl) { window.location.href="/"; return; }
      const extUrl = getExternalUrl(player, streamUrl);
      if (extUrl) { window.location.href = extUrl; setLaunched(true); }
    }
  }, [favId, streamId, streamUrl, cat]);

  useEffect(() => {
    if (!isLive || !dns || !username || !password) return;
    Promise.all([
      fetchXtream(`${dns}/player_api.php?username=${username}&password=${password}&action=get_live_categories`),
      fetchXtream(`${dns}/player_api.php?username=${username}&password=${password}&action=get_live_streams`),
    ]).then(([cats, chs]) => {
      setCategories(Array.isArray(cats)?cats:[]);
      setChannels(Array.isArray(chs)?chs:[]);
      if (cat !== "all") setGuideFilter(cat);
    }).catch(()=>{});
  }, [isLive, dns, username, password, cat]);

  useEffect(() => {
    if (!isLive || !dns || !username || !password || !streamId) return;
    fetchXtream(`${dns}/player_api.php?username=${username}&password=${password}&action=get_simple_data_table&stream_id=${streamId}`)
      .then(data => {
        const entries: EpgEntry[] = (data?.epg_listings || []).map((e:any) => ({
          title: e.title ? (() => { try { return decodeURIComponent(escape(atob(e.title))); } catch { return atob(e.title); } })() : "Sem informação",
          description: e.description ? (() => { try { return decodeURIComponent(escape(atob(e.description))); } catch { return atob(e.description); } })() : "",
          start: e.start_timestamp * 1000,
          end: e.stop_timestamp * 1000,
        }));
        if (entries.length > 0) {
          setEpgData(prev => ({...prev, [streamId]: entries}));
          const now = Date.now();
          const current = entries.find(e => e.start <= now && e.end >= now);
          if (current) {
            setCurrentEpg(current);
            const next = entries.find(e => e.start > now);
            if (next) setNextEpg(next);
          }
        }
      }).catch(()=>{});
  }, [isLive, dns, username, password, streamId]);

  useEffect(() => {
    if (!showGuide || !isLive || !dns || !username || !password || channels.length === 0) return;
    setEpgLoading(true);
    const visibleChs = channels.filter(c => guideFilter === "all" || c.category_id === guideFilter);
    const batch = visibleChs.slice(0, 50);
    Promise.allSettled(
      batch.map((ch: Channel) =>
        fetchXtream(`${dns}/player_api.php?username=${username}&password=${password}&action=get_simple_data_table&stream_id=${ch.stream_id}`)
          .then(data => {
            const now = Date.now();
            const entries: EpgEntry[] = (data?.epg_listings || []).map((e:any) => ({
              title: e.title ? (() => { try { return decodeURIComponent(escape(atob(e.title))); } catch { return atob(e.title); } })() : "Sem informação",
              description: "",
              start: e.start_timestamp * 1000,
              end: e.stop_timestamp * 1000,
            }));
            const current = entries.find(e => e.start <= now && e.end >= now);
            if (current) setEpgData(prev => ({...prev, [ch.stream_id]: entries}));
          }).catch(()=>{})
      )
    ).finally(() => setEpgLoading(false));
  }, [showGuide, channels.length, guideFilter]);

  // Fetch filmes da mesma categoria
  useEffect(() => {
    if (!showGuide || isLive || isSeries || !dns || !username || !password) return;
    const catId = params.get("category_id") || "";
    const url = catId
      ? `${dns}/player_api.php?username=${username}&password=${password}&action=get_vod_streams&category_id=${catId}`
      : `${dns}/player_api.php?username=${username}&password=${password}&action=get_vod_streams`;
    fetchXtream(url).then((data:any) => {
      if (Array.isArray(data)) setVodItems(data.slice(0,60));
    }).catch(()=>{});
  }, [showGuide, isLive, isSeries]);

  // Fetch episódios da série
  useEffect(() => {
    if (!showGuide || !isSeries || !dns || !username || !password || !seriesId) return;
    fetchXtream(`${dns}/player_api.php?username=${username}&password=${password}&action=get_series_info&series_id=${seriesId}`)
      .then((data:any) => {
        const eps: {id:number;title:string;episode_num:number;season:number}[] = [];
        if (data?.episodes) {
          Object.values(data.episodes).forEach((seasonEps:any) => {
            if (Array.isArray(seasonEps)) seasonEps.forEach((ep:any) => eps.push({
              id: Number(ep.id),
              title: ep.title || `Episódio ${ep.episode_num}`,
              episode_num: Number(ep.episode_num),
              season: Number(ep.season)
            }));
          });
        }
        setSeriesEps(eps);
      }).catch(()=>{});
  }, [showGuide, isSeries]);

  function getChannelEpg(streamId: number): EpgEntry|null {
    const entries = epgData[String(streamId)];
    if (!entries) return null;
    const now = Date.now();
    return entries.find(e => e.start <= now && e.end >= now) || null;
  }

  function getEpgProgress(epg: EpgEntry): number {
    const now = Date.now();
    return Math.min(100, Math.max(0, ((now - epg.start) / (epg.end - epg.start)) * 100));
  }

  function fmtTime(ts: number): string {
    return new Date(ts).toLocaleTimeString("pt-BR", {hour:"2-digit", minute:"2-digit"});
  }

  function toggleFav() {
    if (fav) { removeFavorite(favId); setFav(false); }
    else { addFavorite({ id: favId, type: isLive?"live":isSeries?"series":"vod", name, stream_id: Number(streamId), addedAt: Date.now() }); setFav(true); }
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2,"0")}`;
  }

  const loadStream = useCallback(async (url: string) => {
    const video = videoRef.current;
    if (!video) return;
    hlsRef.current?.destroy();
    hlsRef.current = null;

    const tryPlay = () => video.play().then(() => setPlaying(true)).catch(() => {});

    if (url.includes(".m3u8") || isLive) {
      try {
        const HlsMod = await import("hls.js");
        const Hls = HlsMod.default || HlsMod;
        if (Hls && Hls.isSupported && Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: false,
            liveSyncDurationCount: 3,
            liveMaxLatencyDurationCount: 10,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            manifestLoadingTimeOut: 15000,
            manifestLoadingMaxRetry: 5,
            levelLoadingTimeOut: 15000,
            levelLoadingMaxRetry: 5,
            fragLoadingTimeOut: 30000,
            fragLoadingMaxRetry: 8,
            xhrSetup: (xhr: XMLHttpRequest) => {
              xhr.withCredentials = false;
            },
          });
          hls.loadSource(url);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => tryPlay());
          hls.on(Hls.Events.ERROR, (_: unknown, d: {fatal?: boolean; type?: string}) => {
            if (d.fatal) {
              hls.destroy();
              video.src = url;
              tryPlay();
            }
          });
          hlsRef.current = hls;
          return;
        }
      } catch (e) {
        console.warn("HLS.js failed, fallback to native", e);
      }
      // Fallback nativo (Safari / TV / alguns WebViews)
      video.src = url;
      tryPlay();
    } else {
      video.src = url;
      tryPlay();
    }
  }, [isLive]);

  useEffect(() => {
    if (!launched && streamUrl) loadStream(streamUrl); else if (!launched && !streamUrl) window.location.href="/";
    // Verificar progresso salvo após carregar
    if (!launched && !isLive) {
      setTimeout(() => checkSavedProgress(), 1000);
    }
    return () => { hlsRef.current?.destroy(); if(countdownRef.current) window.clearInterval(countdownRef.current); };
  }, [streamUrl, launched, loadStream]);

  function handleVideoEnded() {
    if (!nextEpId || !isSeries) return;
    setNextEpName(nextEpTitle || "Próximo episódio");
    setCountdown(10);
    countdownRef.current = window.setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          window.clearInterval(countdownRef.current!);
          const nextUrl = new URLSearchParams({
            stream: nextEpId, dns: dns||"", username: username||"", password: password||"",
            name: nextEpTitle||"Episódio", type: "series",
            series_id: seriesId||"", series_name: params.get("series_name")||"",
          });
          window.location.href = `/player?${nextUrl.toString()}`;
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function cancelAutoplay() {
    if (countdownRef.current) window.clearInterval(countdownRef.current);
    setCountdown(null);
  }

  function switchChannel(ch: Channel) {
    if (!dns || !username || !password) return;
    const newUrl = `${dns}/live/${username}/${password}/${ch.stream_id}.m3u8`;
    const newParams = new URLSearchParams({ stream: String(ch.stream_id), dns, username, password, name: ch.name, type: "live", cat: guideFilter });
    window.history.replaceState({}, "", `/player?${newParams.toString()}`);
    loadStream(newUrl);
    setShowGuide(false);
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  }

  // Salvar progresso
  function saveProgress() {
    if (!streamId) return;
    // Salvar progresso para VOD
    if (!isLive) {
      const v = videoRef.current;
      if (v && v.currentTime > 5) {
        const key = `iptv_progress_${type}_${streamId}`;
        localStorage.setItem(key, JSON.stringify({
          time: v.currentTime,
          duration: v.duration || 0,
          name, type, streamId,
          savedAt: Date.now()
        }));
      }
    }
    // Salvar no histórico (canais e VOD)
    try {
      const histKey = "iptv_history";
      const hist = JSON.parse(localStorage.getItem(histKey)||"[]");
      const item = {
        id: `${type}-${streamId}`,
        name, type,
        stream_id: Number(streamId),
        icon: params.get("icon") || "",
        watchedAt: Date.now()
      };
      const filtered = hist.filter((h:any) => h.id !== item.id);
      localStorage.setItem(histKey, JSON.stringify([item, ...filtered].slice(0,20)));
    } catch {}
  }

  // Verificar progresso salvo ao abrir
  function checkSavedProgress() {
    if (!streamId || isLive) return;
    const key = `iptv_progress_${type}_${streamId}`;
    try {
      const saved = JSON.parse(localStorage.getItem(key)||"null");
      if (saved && saved.time > 10 && saved.duration && (saved.time/saved.duration) < 0.95) {
        setSavedTime(saved.time);
        setShowContinue(true);
      }
    } catch {}
  }

  function enterFullscreen() {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(()=>{});
    else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
    try {
      const o = screen.orientation as any;
      if (o?.lock) o.lock("landscape").catch(()=>{});
    } catch {}
    setIsFullscreen(true);
  }

  function exitFullscreen() {
    if (document.exitFullscreen) document.exitFullscreen().catch(()=>{});
    else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
    try { (screen.orientation as any)?.unlock?.(); } catch {}
    setIsFullscreen(false);
  }

  function toggleFullscreen() {
    if (isFullscreen) exitFullscreen();
    else enterFullscreen();
  }

  function toggleRotation() {
    if (isRotated) {
      try { (screen.orientation as any)?.unlock?.(); } catch {}
      setIsRotated(false);
      if (document.exitFullscreen) document.exitFullscreen().catch(()=>{});
      else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
    } else {
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen().catch(()=>{});
      else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
      try {
        const o = screen.orientation as any;
        if (o?.lock) o.lock("landscape").catch(()=>{});
      } catch {}
      setIsRotated(true);
    }
  }

  // Esconder sidebar e menu mobile quando player abrir
  useEffect(() => {
    const sidebar = document.querySelector("aside") as HTMLElement | null;
    const nav = document.querySelector("nav") as HTMLElement | null;
    const main = document.getElementById("main-content") as HTMLElement | null;
    if (sidebar) { sidebar.style.display = "none"; sidebar.style.width = "0"; sidebar.style.overflow = "hidden"; }
    if (nav) nav.style.display = "none";
    if (main) { main.style.paddingBottom = "0"; main.style.overflow = "hidden"; }
    return () => {
      const s = document.querySelector("aside") as HTMLElement | null;
      const n = document.querySelector("nav") as HTMLElement | null;
      const m = document.getElementById("main-content") as HTMLElement | null;
      if (s) { s.style.display = ""; s.style.width = ""; s.style.overflow = ""; }
      if (n) n.style.display = "";
      if (m) { m.style.paddingBottom = ""; m.style.overflow = ""; }
    };
  }, []);
  // Auto fullscreen no desktop apenas para live e series
  useEffect(() => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile && (type === "live" || type === "series")) {
      const timer = setTimeout(() => enterFullscreen(), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    function onFsChange() {
      const isFull = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isFull);
      if (!isFull && !isRotated) {
        try { (screen.orientation as any)?.unlock?.(); } catch {}
      }
    }
    function onResize() {
      const isLandscape = window.innerWidth > window.innerHeight;
      const prompt = document.getElementById("landscape-prompt");
      const isFull = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      if (isLandscape && !isFull && !isRotated && prompt) {
        // Girou sem usar o botão — mostrar prompt
        prompt.style.display = "flex";
      } else if (prompt) {
        prompt.style.display = "none";
      }
    }
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      window.removeEventListener("resize", onResize);
      const prompt = document.getElementById("landscape-prompt");
      if (prompt) prompt.style.display = "none";
    };
  }, [isRotated]);

  useEffect(() => {
    const mainSidebar = document.querySelector("aside") as HTMLElement | null;
    const mobileNav = document.querySelector("nav") as HTMLElement | null;
    if (isFullscreen) {
      if (mainSidebar) mainSidebar.style.display = "none";
      if (mobileNav) mobileNav.style.display = "none";
      document.body.style.overflow = "hidden";
    } else {
      if (mainSidebar) mainSidebar.style.display = "";
      if (mobileNav) mobileNav.style.display = "";
      document.body.style.overflow = "";
    }
    return () => {
      if (mainSidebar) mainSidebar.style.display = "";
      if (mobileNav) mobileNav.style.display = "";
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  useEffect(() => {
    return () => {
      try { (screen.orientation as any)?.unlock?.(); } catch {}
      if (document.fullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen().catch(()=>{});
      }
    };
  }, []);

  function handleMouseMove() {
    setShowControls(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setShowControls(false), 1500);
  }

  useEffect(() => () => { if (hideTimer.current) window.clearTimeout(hideTimer.current); }, []);

  const guideChannels = channels.filter(c => guideFilter === "all" || c.category_id === guideFilter);

  if (launched) return (
    <div className="flex h-screen bg-black items-center justify-center flex-col gap-4">
      <p className="text-white text-sm">Abrindo player externo...</p>
      <Link href={backHref} className="text-violet-400 text-sm">← Voltar</Link>
    </div>
  );

  return (
    <div className="flex bg-black" onMouseMove={handleMouseMove}
      onClick={()=>{setShowControls(true); if(hideTimer.current) window.clearTimeout(hideTimer.current); hideTimer.current = window.setTimeout(()=>setShowControls(false), 3000);}}
      style={{marginLeft:"0px",width:"100%",height:"100dvh"}}>
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        <video ref={videoRef} className={`w-full h-full bg-black "object-contain"`}
          onTimeUpdate={() => { const v=videoRef.current; if(!v||!v.duration) return; setProgress((v.currentTime/v.duration)*100||0); setCurrentTime(fmt(v.currentTime)); setDuration(fmt(v.duration)); if(!isLive && Math.floor(v.currentTime)%15===0 && v.currentTime>0) saveProgress(); }}
          onPlay={()=>{setPlaying(true); if(hideTimer.current) window.clearTimeout(hideTimer.current); setShowControls(false); saveProgress();}} onPause={()=>{setPlaying(false); setShowControls(true);}}
          onLoadedMetadata={()=>checkSavedProgress()}
          onEnded={handleVideoEnded}
          onClick={togglePlay} playsInline/>

        {/* Ícone pause no centro */}
        {!playing && !showContinue && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
              </svg>
            </div>
          </div>
        )}
        {/* Ícone pause no centro */}
        {!playing && !showContinue && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
              </svg>
            </div>
          </div>
        )}
        {/* Modal continuar assistindo */}
        {showContinue && !isLive && (
          <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/60">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-80 mx-4">
              <div className="w-12 h-12 rounded-full bg-violet-600/20 flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" strokeWidth={2}><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
              <h3 className="text-white font-semibold text-center mb-1">Continuar assistindo?</h3>
              <p className="text-zinc-400 text-sm text-center mb-5">
                Você parou em {Math.floor(savedTime/60)}:{String(Math.floor(savedTime%60)).padStart(2,"0")}. Deseja continuar de onde parou?
              </p>
              <div className="flex gap-3">
                <button onClick={()=>{
                  setShowContinue(false);
                  const v = videoRef.current;
                  if (v) { v.currentTime = savedTime; }
                }} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
                  Sim, continuar
                </button>
                <button onClick={()=>{
                  setShowContinue(false);
                  const key = `iptv_progress_${type}_${streamId}`;
                  localStorage.removeItem(key);
                }} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium py-2.5 rounded-xl transition-colors">
                  Não, recomeçar
                </button>
              </div>
            </div>
          </div>
        )}

        {countdown !== null && (
          <div className="absolute inset-0 flex items-end justify-end z-20" style={{padding:"0 24px 100px 24px"}}>
            <div className="bg-zinc-900/95 border border-zinc-700 rounded-2xl p-5 w-72">
              <p className="text-xs text-zinc-400 mb-1 uppercase tracking-wider">A seguir</p>
              <p className="text-white font-semibold text-sm mb-3 truncate">{nextEpName}</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full transition-all duration-1000" style={{width:`${((10-countdown)/10)*100}%`}}/>
                </div>
                <span className="text-xs text-zinc-400 w-4">{countdown}s</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={()=>{ if(countdownRef.current) window.clearInterval(countdownRef.current); setCountdown(null); window.location.href = `/player?${new URLSearchParams({stream:nextEpId!,dns:dns||"",username:username||"",password:password||"",name:nextEpTitle||"",type:"series",series_id:seriesId||"",series_name:params.get("series_name")||""}).toString()}`; }}
                  className="flex-1 bg-violet-600 text-white text-xs font-medium py-2 rounded-lg hover:bg-violet-500 transition-colors">
                  Assistir agora
                </button>
                <button onClick={cancelAutoplay} className="px-3 py-2 bg-zinc-800 text-zinc-400 text-xs rounded-lg hover:bg-zinc-700 transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top bar */}
        <div className={`absolute top-0 left-0 right-0 transition-opacity duration-300 ${showControls?"opacity-100":"opacity-0"}`}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-transparent pointer-events-none h-28"/>
          <div className="relative flex items-center justify-between" style={{padding:"16px 20px"}}>
            <div className="flex items-center gap-3">
              <button onClick={()=>{ window.location.href = backHref; }} className="w-9 h-9 rounded-xl bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              </button>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-semibold text-white leading-tight truncate max-w-[200px] sm:max-w-md">{name}</p>
                <p className="text-xs text-zinc-300 mt-0.5 flex items-center gap-1.5">
                  {isLive&&<span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block"/>}
                  {isLive?"Ao vivo":isSeries?"Série":"Filme"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {streamId&&(
                <button onClick={toggleFav} className="w-9 h-9 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill={fav?"#f43f5e":"none"} stroke={fav?"#f43f5e":"white"} strokeWidth={2} strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                </button>
              )}
              <button onClick={()=>setShowGuide(g=>!g)} className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors border ${showGuide?"bg-violet-600 border-violet-400":"bg-black/60 border-white/40 hover:bg-black/80"}`}>
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${showControls?"opacity-100":"opacity-0"}`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none h-28"/>
          <div className="relative" style={{padding:"0 20px 80px 20px"}}>
            {isLive&&currentEpg&&(
              <div className="mb-4 px-1">
                <p className="text-sm font-medium text-white truncate mb-1.5">{currentEpg.title}</p>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-zinc-400 w-10">{fmtTime(currentEpg.start)}</span>
                  <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full transition-all" style={{width:`${getEpgProgress(currentEpg)}%`}}/>
                  </div>
                  <span className="text-xs text-zinc-400 w-10 text-right">{fmtTime(currentEpg.end)}</span>
                </div>
                {nextEpg&&(
                  <p className="text-xs text-zinc-400 mt-1 truncate">
                    <span className="text-zinc-500">A seguir {fmtTime(nextEpg.start)}: </span>{nextEpg.title}
                  </p>
                )}
              </div>
            )}
            {!isLive&&(
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs text-zinc-300 w-10 text-right">{currentTime}</span>
                <input type="range" min="0" max="100" step="0.1" value={progress}
                  onChange={e=>{const v=videoRef.current;if(v)v.currentTime=(Number(e.target.value)/100)*v.duration;}}
                  className="flex-1 h-1 accent-violet-500 cursor-pointer"/>
                <span className="text-xs text-zinc-300 w-10">{duration}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={()=>{ if(document.fullscreenElement) exitFullscreen(); else enterFullscreen(); }}
                  className={`w-8 h-8 rounded-full bg-black/60 items-center justify-center hover:bg-white/20 transition-colors border border-white/20 ${isRotated ? "hidden" : "hidden md:flex"}`}>
                  {document.fullscreenElement
                    ? <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2}><path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/></svg>
                    : <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2}><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
                  }
                </button>
                <button onClick={toggleRotation}
                  className="md:hidden w-10 h-10 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors border border-white/20">
                  {isRotated
                    ? <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 9L3 3m0 6V3h6M15 15l6 6m0-6v6h-6"/></svg>
                    : <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  }
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Painel lateral */}
      {showGuide&&(
        <div className="w-72 h-full flex flex-col flex-shrink-0" style={{background:"rgba(8,8,8,0.97)",borderLeft:"1px solid rgba(255,255,255,0.07)",paddingBottom:"90px"}}>
          <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">
              {isLive?"Canais":isSeries?"Episódios":"Mais filmes"}
            </h3>
            <button onClick={()=>setShowGuide(false)} className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          {isLive&&(
            <>
              <div className="px-3 py-2 border-b border-white/5">
                <select value={guideFilter} onChange={e=>setGuideFilter(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-xs text-white px-3 py-2 rounded-lg focus:outline-none focus:border-violet-500">
                  <option value="all">Todas as categorias</option>
                  {categories.map(c=><option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                </select>
              </div>
              <div className="flex-1 overflow-y-auto">
                {guideChannels.slice(0,200).map(ch=>{
                  const isCurrent = String(ch.stream_id) === streamId;
                  return(
                    <button key={ch.stream_id} onClick={()=>switchChannel(ch)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${isCurrent?"bg-violet-600/20 border-l-2 border-violet-500":"hover:bg-white/5 border-l-2 border-transparent"}`}>
                      <div className="w-10 h-7 rounded bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {ch.stream_icon?<img src={ch.stream_icon} alt="" className="w-full h-full object-contain" onError={e=>{(e.target as HTMLImageElement).style.display="none"}}/>
                          :<span className="text-[9px] font-bold text-zinc-600">{ch.name.slice(0,3)}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs truncate ${isCurrent?"text-violet-300 font-medium":"text-zinc-300"}`}>{ch.name}</p>
                        {(()=>{const epg=getChannelEpg(ch.stream_id);return epg?(
                          <div className="mt-0.5">
                            <p className="text-[10px] text-zinc-500 truncate">{epg.title}</p>
                            <div className="w-full h-0.5 bg-zinc-800 rounded-full overflow-hidden mt-0.5">
                              <div className="h-full bg-violet-600/60 rounded-full" style={{width:`${getEpgProgress(epg)}%`}}/>
                            </div>
                          </div>
                        ):null;})()}
                      </div>
                      {isCurrent&&<div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0"/>}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {!isLive&&!isSeries&&(
            <div className="flex-1 overflow-y-auto">
              {vodItems.length===0?(
                <div className="flex items-center justify-center h-32">
                  <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"/>
                </div>
              ):vodItems.map(item=>{
                const isCurrent = String(item.stream_id)===streamId;
                return(
                  <button key={item.stream_id}
                    onClick={()=>{ if(!dns||!username||!password) return; window.location.href=`/player?stream=${item.stream_id}&dns=${encodeURIComponent(dns)}&username=${username}&password=${password}&name=${encodeURIComponent(item.name)}&type=vod&category_id=${item.category_id}`; }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${isCurrent?"bg-violet-600/20 border-l-2 border-violet-500":"hover:bg-white/5 border-l-2 border-transparent"}`}>
                    <div className="w-10 h-14 rounded bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.stream_icon?<img src={item.stream_icon} alt="" className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display="none"}}/>:<svg viewBox="0 0 24 24" className="w-4 h-4 text-zinc-600" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
                    </div>
                    <p className={`text-xs flex-1 truncate ${isCurrent?"text-violet-300 font-medium":"text-zinc-300"}`}>{item.name}</p>
                    {isCurrent&&<div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0"/>}
                  </button>
                );
              })}
            </div>
          )}
          {isSeries&&(
            <div className="flex-1 overflow-y-auto">
              {seriesEps.length===0?(
                <div className="flex items-center justify-center h-32">
                  <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"/>
                </div>
              ):seriesEps.map(ep=>{
                const isCurrent = String(ep.id)===streamId;
                return(
                  <button key={ep.id}
                    onClick={()=>{ if(!dns||!username||!password) return; window.location.href=`/player?${new URLSearchParams({stream:String(ep.id),dns,username,password,name:ep.title,type:"series",series_id:seriesId||"",series_name:params.get("series_name")||""}).toString()}`; }}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${isCurrent?"bg-violet-600/20 border-l-2 border-violet-500":"hover:bg-white/5 border-l-2 border-transparent"}`}>
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-zinc-400">{ep.episode_num}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs truncate ${isCurrent?"text-violet-300 font-medium":"text-zinc-300"}`}>{ep.title}</p>
                      <p className="text-[10px] text-zinc-500">T{ep.season} · Ep {ep.episode_num}</p>
                    </div>
                    {isCurrent&&<div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0"/>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PlayerPage() {
  return <Suspense><PlayerContent/></Suspense>;
}
