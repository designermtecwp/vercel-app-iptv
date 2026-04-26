"use client";
import { fetchXtream } from "@/lib/fetch-proxy";
import { useState, useEffect, useRef } from "react";

import { getSettings, isAdultCategory, sortItems } from "@/lib/settings";
import PinPrompt from "@/components/PinPrompt";

interface Channel { stream_id:number; name:string; stream_icon:string; category_id:string; }
interface Category { category_id:string; category_name:string; }

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [active, setActive] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [creds, setCreds] = useState<{dns:string;user:string;pass:string}|null>(null);
  const [showCats, setShowCats] = useState(false);
  const [pinPrompt, setPinPrompt] = useState<{catId:string;catName:string}|null>(null);
  const [unlockedCats, setUnlockedCats] = useState<string[]>([]);
  const [limit, setLimit] = useState(60);
  const [epgNow, setEpgNow] = useState<{[id:string]:string}>({});
  const drawerRef = useRef<HTMLDivElement>(null);
  const settings = getSettings();

  useEffect(() => {
    const lastCat = sessionStorage.getItem("channels_last_cat");
    if (lastCat) setActive(lastCat);
    const dns = localStorage.getItem("xtream_dns");
    const user = localStorage.getItem("xtream_user");
    const pass = localStorage.getItem("xtream_pass");
    if (dns && user && pass) {
      setCreds({dns,user,pass});
      Promise.all([
        fetchXtream(`${dns}/player_api.php?username=${user}&password=${pass}&action=get_live_categories`),
        fetchXtream(`${dns}/player_api.php?username=${user}&password=${pass}&action=get_live_streams`),
      ]).then(([cats, chs]) => {
        const chList = Array.isArray(chs)?chs:[];
        setCategories(Array.isArray(cats)?cats:[]);
        setChannels(chList);
        setLoading(false);
        // Carrega EPG dos primeiros 80 canais (sem await — fire and forget)
        const sample = chList.slice(0,20);
        const epgMap: {[id:string]:string} = {};
        Promise.allSettled(
          sample.map((c: {stream_id:number}) =>
            fetch(`${dns}/player_api.php?username=${user}&password=${pass}&action=get_simple_data_table&stream_id=${c.stream_id}`)
              .then(r=>r.json())
              .then(d => {
                const now = Date.now();
                const cur = (d?.epg_listings||[]).find((e:any) => e.start_timestamp*1000<=now && e.stop_timestamp*1000>=now);
                if (cur?.title) epgMap[c.stream_id] = (() => { try { return decodeURIComponent(escape(atob(cur.title))); } catch { return atob(cur.title); } })();
              }).catch(()=>{})
          )
        ).then(() => setEpgNow({...epgMap}));
      }).catch(()=>setLoading(false));
    } else {
      window.location.href="/";
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    function h(e: MouseEvent) { if(drawerRef.current&&!drawerRef.current.contains(e.target as Node)) setShowCats(false); }
    if(showCats) document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  }, [showCats]);

  function selectCat(id: string, catName: string) {
    const s = getSettings();
    const isAdult = isAdultCategory(catName);
    const isLocked = s.parentalEnabled && s.adultLocked && isAdult && !unlockedCats.includes(id);
    if (isLocked) { setPinPrompt({catId:id,catName}); setShowCats(false); return; }
    setActive(id); sessionStorage.setItem("channels_last_cat", id); setShowCats(false);
  }

  function openChannel(ch: Channel) {
    if (!creds) return;
    const cat = categories.find(c=>c.category_id===ch.category_id);
    const s = getSettings();
    const isAdult = isAdultCategory(cat?.category_name||"");
    const isLocked = s.parentalEnabled && s.adultLocked && isAdult && !unlockedCats.includes(ch.category_id);
    if (isLocked) { setPinPrompt({catId:ch.category_id,catName:cat?.category_name||""}); return; }
    sessionStorage.setItem("channels_last_cat", active);
    window.location.href = `/player?stream=${ch.stream_id}&dns=${encodeURIComponent(creds.dns)}&username=${creds.user}&password=${creds.pass}&name=${encodeURIComponent(ch.name)}&type=live&cat=${encodeURIComponent(active)}&icon=${encodeURIComponent(ch.stream_icon||'')}`;
  }

  // Filtrar categorias ocultas
  const visibleCategories = categories.filter(c => !settings.hiddenCats.find(h=>h.id===c.category_id));

  const filtered = sortItems(
    channels.filter(ch => {
      const cat = categories.find(c=>c.category_id===ch.category_id);
      if (settings.hiddenCats.find(h=>h.id===ch.category_id)) return false;
      const matchCat = active==="all"||ch.category_id===active;
      return matchCat && ch.name.toLowerCase().includes(search.toLowerCase());
    }),
    settings.sortOrder
  );

  const activeCat = visibleCategories.find(c=>c.category_id===active);
  const dotColors = ["#7c3aed","#3b82f6","#f59e0b","#ef4444","#10b981","#6366f1","#ec4899","#f97316"];

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {pinPrompt && (
        <PinPrompt
          title={`Categoria protegida: ${pinPrompt.catName}`}
          onSuccess={()=>{ setUnlockedCats(p=>[...p,pinPrompt.catId]); setActive(pinPrompt.catId); sessionStorage.setItem("channels_last_cat",pinPrompt.catId); setPinPrompt(null); }}
          onCancel={()=>setPinPrompt(null)}
        />
      )}

      <div className="flex items-center justify-between px-4 pt-3 pb-2 sm:px-6 sm:pt-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-white">Canais ao vivo</h1>
          {channels.length>0&&<span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full border border-white/20">{filtered.length}</span>}
        </div>
        <div className="flex items-center gap-2 sm:flex-none">
          <div className="relative">
            <input type="text" placeholder="Buscar" value={search} onChange={e=>setSearch(e.target.value)}
              className="w-full sm:w-44 bg-zinc-900 border border-zinc-800 text-sm text-white px-3 py-1.5 rounded-xl focus:outline-none focus:border-violet-500 placeholder-zinc-500"/>
          </div>
          <button onClick={()=>setShowCats(true)}
            className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${active!=="all"?"bg-violet-600 border-violet-600 text-white":"bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"}`}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            <span className="max-w-[100px] truncate">{active==="all"?"Categorias":activeCat?.category_name||""}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-1">
            {[...Array(10)].map((_,i)=><div key={i} className="bg-zinc-900 rounded-xl h-44 animate-pulse"/>)}
          </div>
        ) : filtered.length===0 ? (
          <div className="flex items-center justify-center h-full text-zinc-600"><p className="text-sm">Nenhum canal encontrado</p></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-3 p-1">
            {filtered.map(ch=>{
              const cat = categories.find(c=>c.category_id===ch.category_id);
              const isAdult = isAdultCategory(cat?.category_name||"");
              const s = getSettings();
              const isLocked = s.parentalEnabled && s.adultLocked && isAdult && !unlockedCats.includes(ch.category_id);
              return (
                <div key={ch.stream_id} onClick={()=>openChannel(ch)}
                  tabIndex={0} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden cursor-pointer hover:border-violet-600 transition-all hover:scale-[1.015] group">
                  <div className="h-24 flex items-center justify-center relative bg-zinc-900">
                    {isLocked ? (
                      <svg viewBox="0 0 24 24" className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    ) : ch.stream_icon ? (
                      <img src={ch.stream_icon} alt={ch.name} className="w-20 h-14 object-contain"
                        onError={e=>{(e.target as HTMLImageElement).style.display="none"; (e.target as HTMLImageElement).parentElement!.innerHTML+='<span style="color:rgba(255,255,255,0.3);font-size:18px;font-weight:700">'+ch.name.slice(0,4).toUpperCase()+'</span>';}}/>
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <span className="text-2xl font-bold text-white/30 text-center px-2 leading-tight">{ch.name.slice(0,4).toUpperCase()}</span>
                      </div>
                    )}
                    {!isLocked && <div className="absolute bottom-1.5 right-2 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/></div>}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium text-white truncate">{isLocked?"Conteúdo protegido":ch.name}</p>
                    
                    <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{cat?.category_name??""}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCats&&(
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setShowCats(false)}/>
          <div ref={drawerRef} className="relative ml-16 w-72 h-full flex flex-col" style={{background:"rgba(10,10,10,0.97)",borderRight:"1px solid rgba(255,255,255,0.07)"}}>
            <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-white/5">
              <div><h2 className="text-sm font-semibold text-white">Categorias</h2><p className="text-xs text-zinc-600 mt-0.5">{visibleCategories.length} categorias</p></div>
              <button onClick={()=>setShowCats(false)} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center hover:bg-zinc-700">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="px-3 pt-3">
              <button onClick={()=>{setActive("all");sessionStorage.setItem("channels_last_cat","all");setShowCats(false);}}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all mb-1 ${active==="all"?"bg-violet-600 text-white":"text-zinc-400 hover:bg-white/5 hover:text-white"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${active==="all"?"bg-white/20":"bg-zinc-800"}`}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 3l-4 4-4-4"/></svg>
                </div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium">Todos os canais</p><p className={`text-xs ${active==="all"?"text-white/60":"text-zinc-600"}`}>{channels.length} canais</p></div>
                {active==="all"&&<div className="w-1.5 h-6 bg-white/40 rounded-full"/>}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-0.5">
              {visibleCategories.map((cat,i)=>{
                const count=channels.filter(c=>c.category_id===cat.category_id).length;
                const isActive=active===cat.category_id;
                const isAdult=isAdultCategory(cat.category_name);
                const s=getSettings();
                const isLocked=s.parentalEnabled&&s.adultLocked&&isAdult&&!unlockedCats.includes(cat.category_id);
                return(
                  <button key={cat.category_id} onClick={()=>selectCat(cat.category_id,cat.category_name)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isActive?"bg-violet-600/20 border border-violet-500/30":"hover:bg-white/4 border border-transparent"}`}>
                    {isLocked
                      ?<svg viewBox="0 0 24 24" className="w-3 h-3 text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      :<div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:dotColors[i%8]}}/>}
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
