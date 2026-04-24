"use client";
import { fetchXtream } from "@/lib/fetch-proxy";
import { getSettings } from "@/lib/settings";
import { useState, useEffect, useRef } from "react";

interface VodStream { stream_id:number; name:string; stream_icon:string; category_id:string; rating?:string; }
interface Category { category_id:string; category_name:string; }

const catCache = new Map<string, VodStream[]>();


function proxyUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://")) return `/api/img?url=${encodeURIComponent(url)}`;
  return url;
}
export default function MoviesPage() {
  const [items, setItems] = useState<VodStream[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [genre, setGenre] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingCat, setLoadingCat] = useState(false);
  const [creds, setCreds] = useState<{dns:string;user:string;pass:string}|null>(null);
  const [showCats, setShowCats] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const credsRef = useRef<{dns:string;user:string;pass:string}|null>(null);

  useEffect(() => {
    const dns = localStorage.getItem("xtream_dns");
    const user = localStorage.getItem("xtream_user");
    const pass = localStorage.getItem("xtream_pass");
    if (dns && user && pass) {
      const c = {dns,user,pass};
      setCreds(c);
      credsRef.current = c;
      // SÃ³ carrega categorias â€” leve
      fetchXtream(`${dns}/player_api.php?username=${user}&password=${pass}&action=get_vod_categories`)
        .then(cats => {
          const list = Array.isArray(cats) ? cats : [];
          setCategories(list);
          // Carrega primeira categoria automaticamente
          if (list.length > 0) {
            loadCategory(list[0].category_id, c);
          } else {
            setLoading(false);
          }
        }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function loadCategory(catId: string, c?: {dns:string;user:string;pass:string}) {
    const cred = c || credsRef.current;
    if (!cred) return;
    if (catCache.has(catId)) {
      setItems(catCache.get(catId)!);
      setLoading(false);
      setLoadingCat(false);
      return;
    }
    setLoadingCat(true);
    try {
      const url = catId === "all"
        ? `${cred.dns}/player_api.php?username=${cred.user}&password=${cred.pass}&action=get_vod_streams`
        : `${cred.dns}/player_api.php?username=${cred.user}&password=${cred.pass}&action=get_vod_streams&category_id=${catId}`;
      const vods = await fetchXtream(url);
      const list = Array.isArray(vods) ? vods : [];
      catCache.set(catId, list);
      setItems(list);
    } catch {}
    setLoading(false);
    setLoadingCat(false);
  }

  function selectCategory(catId: string) {
    setGenre(catId);
    setShowCats(false);
    setSearch("");
    loadCategory(catId);
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) setShowCats(false);
    }
    if (showCats) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showCats]);

  const activeCat = categories.find(c => c.category_id === genre);
  const filtered = items.filter(m => {
    const s = getSettings();
    if (s.hiddenCats?.find((h: {id:string}) => h.id === m.category_id)) return false;
    return m.name.toLowerCase().includes(search.toLowerCase());
  });

  const colors = ["#1a0533","#0a1628","#1a1a0a","#1a0a0a","#0a1a1a","#0f0f1a","#1a0a1a","#1a0f0a"];
  const accents = ["#7c3aed","#3b82f6","#f59e0b","#ef4444","#10b981","#6366f1","#ec4899","#f97316"];
  const label = (name: string) => name.replace(/^FILMES\s*[|I]\s*/i,"").trim();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 sm:px-6 sm:pt-5 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-3">
          <h1 className="text-xl font-semibold text-white">Filmes</h1>
          {!loadingCat && items.length > 0 && (
            <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full border border-white/20">{filtered.length}</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-1 sm:flex-none">
          <div className="relative flex-1 sm:flex-none">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)}
              className="w-full sm:w-44 bg-zinc-900 border border-zinc-800 text-sm text-white pl-8 pr-4 py-2 rounded-xl focus:outline-none focus:border-violet-500 placeholder-zinc-600"/>
          </div>
          <button onClick={()=>setShowCats(true)}
            className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl border transition-all whitespace-nowrap ${genre!=="all"?"bg-violet-600 border-violet-600 text-white":"bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"}`}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            <span className="max-w-[100px] truncate">{genre==="all"?"Categorias":label(activeCat?.category_name||"")}</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6">
        {loading || loadingCat ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 pt-2">
            {[...Array(18)].map((_,i) => <div key={i} className="rounded-xl aspect-[2/3] bg-zinc-900 animate-pulse"/>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-600">
            <p className="text-sm">Nenhum filme encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 pt-2">
            {filtered.slice(0, 120).map((item,i) => (
              <div key={item.stream_id}
                onClick={()=>{ if(creds) window.location.href=`/movie/${item.stream_id}?dns=${encodeURIComponent(creds.dns)}&username=${creds.user}&password=${creds.pass}&name=${encodeURIComponent(item.name)}&icon=${encodeURIComponent(item.stream_icon||"")}`; }}
                className="cursor-pointer group">
                <div className="rounded-xl aspect-[2/3] relative overflow-hidden border border-zinc-800 group-hover:border-zinc-600 transition-all"
                  style={{background: item.stream_icon?"#111":colors[i%8]}}>
                  {item.stream_icon
                    ? <img src={proxyUrl(item.stream_icon)} alt={item.name} className="w-full h-full object-cover"
                        onError={e=>{(e.target as HTMLImageElement).style.display="none"}}/>
                    : <div className="w-full h-full flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-6 h-6" fill={accents[i%8]}><path d="M8 5v14l11-7z"/></svg>
                      </div>
                  }
                  {item.rating && parseFloat(item.rating) > 0 && (
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                      style={{background:"rgba(0,0,0,0.72)",backdropFilter:"blur(4px)",color:"#facc15"}}>
                      <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-current"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      {parseFloat(item.rating).toFixed(1)}
                    </div>
                  )}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/50">
                    <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#000"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-white truncate mt-1.5">{item.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Drawer */}
      {showCats && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setShowCats(false)}/>
          <div ref={drawerRef} className="relative ml-16 w-72 h-full flex flex-col"
            style={{background:"rgba(10,10,10,0.97)",borderRight:"1px solid rgba(255,255,255,0.07)"}}>
            <div className="flex items-center justify-between px-5 pt-10 pb-4 border-b border-white/5">
              <div>
                <h2 className="text-sm font-semibold text-white">Categorias</h2>
                <p className="text-xs text-zinc-600 mt-0.5">{categories.length} categorias</p>
              </div>
              <button onClick={()=>setShowCats(false)} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
              {categories.map((cat, i) => {
                const active = genre === cat.category_id;
                const dotColors = ["#7c3aed","#3b82f6","#f59e0b","#ef4444","#10b981","#6366f1","#ec4899","#f97316"];
                return (
                  <button key={cat.category_id} onClick={()=>selectCategory(cat.category_id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${active?"bg-violet-600/20 border border-violet-500/30":"hover:bg-white/5 border border-transparent"}`}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:dotColors[i%8]}}/>
                    <p className={`text-sm flex-1 truncate ${active?"text-white font-medium":"text-zinc-400"}`}>{label(cat.category_name)}</p>
                    {active && <div className="w-1 h-5 bg-violet-400 rounded-full flex-shrink-0"/>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

