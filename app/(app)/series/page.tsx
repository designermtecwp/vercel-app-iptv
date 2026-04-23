"use client";
import { fetchXtream } from "@/lib/fetch-proxy";
import { getSettings, sortItems } from "@/lib/settings";
import { useState, useEffect, useRef } from "react";

interface Serie { series_id:number; name:string; cover:string; category_id:string; }
interface Category { category_id:string; category_name:string; }


function proxyUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://")) return `/api/img?url=${encodeURIComponent(url)}`;
  return url;
}
export default function SeriesPage() {
  const [items, setItems] = useState<Serie[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [genre, setGenre] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [creds, setCreds] = useState<{dns:string;user:string;pass:string}|null>(null);
  const [showCats, setShowCats] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dns = localStorage.getItem("xtream_dns");
    const user = localStorage.getItem("xtream_user");
    const pass = localStorage.getItem("xtream_pass");
    if (dns && user && pass) {
      setCreds({dns,user,pass});
      Promise.all([
        fetchXtream(`${dns}/player_api.php?username=${user}&password=${pass}&action=get_series_categories`),
        fetchXtream(`${dns}/player_api.php?username=${user}&password=${pass}&action=get_series`),
      ]).then(([cats, series]) => {
        setCategories(Array.isArray(cats)?cats:[]);
        setItems(Array.isArray(series)?series:[]);
        setLoading(false);
      }).catch(()=>setLoading(false));
    } else { setLoading(false); }
  }, []);

  useEffect(() => {
    function h(e: MouseEvent) { if(drawerRef.current&&!drawerRef.current.contains(e.target as Node)) setShowCats(false); }
    if(showCats) document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  }, [showCats]);

  const filtered = items.filter(m => {
    const s = getSettings();
    if (s.hiddenCats.find((h: {id:string}) => h.id === m.category_id)) return false;
    return m.name.toLowerCase().includes(search.toLowerCase());
  });

  const activeCat = categories.find(c=>c.category_id===genre);
  const dotColors = ["#7c3aed","#3b82f6","#f59e0b","#ef4444","#10b981","#6366f1","#ec4899","#f97316"];

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 sm:px-6 sm:pt-8 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-3">
          <h1 className="text-xl font-semibold text-white">séries</h1>
          {filtered.length>0&&<span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full border border-white/20">{filtered.length}</span>}
        </div>
        <div className="flex items-center gap-3.5 flex-1 sm:flex-none">
          <div className="relative">
            <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" placeholder="Buscar série..." value={search} onChange={e=>setSearch(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-sm text-white pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-violet-500 placeholder-zinc-600 w-44"/>
          </div>
          <button onClick={()=>setShowCats(true)}
            className={`flex items-center gap-3.5 text-sm px-4 py-2 rounded-xl border transition-all flex-shrink-0 ${showCats||genre!=="all" ? "bg-violet-600 border-violet-600 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600"}`}>
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            {genre==="all"?"Categorias":activeCat?.category_name||"Categoria"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 overflow-x-hidden">
        {loading?(
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {[...Array(10)].map((_,i)=><div key={i} className="rounded-xl aspect-[2/3] bg-zinc-900 animate-pulse"/>)}
          </div>
        ):filtered.length===0?(
          <div className="flex items-center justify-center h-full text-zinc-600"><p className="text-sm">Nenhuma série encontrada</p></div>
        ):(
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 p-1">
            {filtered.slice(0,120).map((item)=>(
              <div key={item.series_id} onClick={()=>{ if(creds) window.location.href=`/series/${item.series_id}?dns=${encodeURIComponent(creds.dns)}&username=${creds.user}&password=${creds.pass}&name=${encodeURIComponent(item.name)}`; }}
                tabIndex={0} className="cursor-pointer group">
                <div className="rounded-xl aspect-[2/3] flex flex-col items-center justify-center mb-2 border border-zinc-800 group-hover:border-zinc-500 transition-all group-hover:scale-[1.015] relative overflow-hidden bg-zinc-900">
                  {item.cover
                    ?<img src={proxyUrl(item.cover)} alt={item.name} className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display="none"}}/>
                    :<svg viewBox="0 0 24 24" className="w-8 h-8 text-zinc-700" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 3l-4 4-4-4"/></svg>}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/60">
                    <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#000"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                </div>
                <p className="text-xs font-medium text-white truncate">{item.name}</p>
                <p className="text-[11px] text-zinc-600 truncate">{categories.find(c=>c.category_id===item.category_id)?.category_name??""}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCats&&(
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setShowCats(false)}/>
          <div ref={drawerRef} className="relative ml-16 w-72 h-full flex flex-col" style={{background:"rgba(10,10,10,0.97)",borderRight:"1px solid rgba(255,255,255,0.07)"}}>
            <div className="flex items-center justify-between px-5 pt-10 pb-4 border-b border-white/5">
              <div>
                <h2 className="text-sm font-semibold text-white">Categorias</h2>
                <p className="text-xs text-zinc-600 mt-0.5">{categories.length} categorias</p>
              </div>
              <button onClick={()=>setShowCats(false)} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="px-3 pt-3">
              <button onClick={()=>{setGenre("all");setShowCats(false);}}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all mb-1 ${genre==="all"?"bg-violet-600 text-white":"text-zinc-400 hover:bg-white/5 hover:text-white"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${genre==="all"?"bg-white/20":"bg-zinc-800"}`}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h20"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Todas as séries</p>
                  <p className={`text-xs ${genre==="all"?"text-white/60":"text-zinc-600"}`}>{items.length} séries</p>
                </div>
                {genre==="all"&&<div className="w-1.5 h-6 bg-white/40 rounded-full"/>}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-0.5">
              {categories.map((cat,i)=>{
                const count=items.filter(s=>s.category_id===cat.category_id).length;
                const isActive=genre===cat.category_id;
                return(
                  <button key={cat.category_id} onClick={()=>{setGenre(cat.category_id);setShowCats(false);}}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isActive?"bg-violet-600/20 border border-violet-500/30":"hover:bg-white/4 border border-transparent"}`}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:dotColors[i%8]}}/>
                    <p className={`text-sm flex-1 truncate ${isActive?"text-white font-medium":"text-zinc-400"}`}>{cat.category_name}</p>
                    <span className={`text-xs flex-shrink-0 ${isActive?"text-violet-300":"text-zinc-600"}`}>{count}</span>
                    {isActive&&<div className="w-1 h-5 bg-violet-400 rounded-full flex-shrink-0"/>}
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



