header_series = """      <div className="flex items-center justify-between px-4 pt-3 pb-2 sm:px-6 sm:pt-5 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-3">
          <h1 className="text-xl font-semibold text-white">Séries</h1>
          {filtered.length>0&&<span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full border border-white/20">{filtered.length}</span>}
        </div>
        <div className="flex items-center gap-2 flex-1 sm:flex-none">
          <div className="relative flex-1 sm:flex-none">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" placeholder="Buscar" value={search} onChange={e=>setSearch(e.target.value)}
              className="w-full sm:w-44 bg-zinc-900 border border-zinc-800 text-sm text-white px-3 py-1.5 rounded-xl focus:outline-none focus:border-violet-500 placeholder-zinc-500"/>
          </div>
          <button onClick={()=>setShowCats(true)}
            className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${genre!=="all"?"bg-violet-600 border-violet-600 text-white":"bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"}`}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            <span className="max-w-[100px] truncate">{genre==="all"?"Categorias":activeCat?.category_name||""}</span>
          </button>
        </div>
      </div>"""

header_channels = """      <div className="flex items-center justify-between px-4 pt-3 pb-2 sm:px-6 sm:pt-5 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-3">
          <h1 className="text-xl font-semibold text-white">Canais ao vivo</h1>
          {channels.length>0&&<span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full border border-white/20">{filtered.length}</span>}
        </div>
        <div className="flex items-center gap-2 flex-1 sm:flex-none">
          <div className="relative flex-1 sm:flex-none">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" placeholder="Buscar" value={search} onChange={e=>setSearch(e.target.value)}
              className="w-full sm:w-44 bg-zinc-900 border border-zinc-800 text-sm text-white px-3 py-1.5 rounded-xl focus:outline-none focus:border-violet-500 placeholder-zinc-500"/>
          </div>
          <button onClick={()=>setShowCats(true)}
            className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${active!=="all"?"bg-violet-600 border-violet-600 text-white":"bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"}`}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            <span className="max-w-[100px] truncate">{active==="all"?"Categorias":activeCat?.category_name||""}</span>
          </button>
        </div>
      </div>"""

import re

for fname, new_header in [("app/(app)/series/page.tsx", header_series), ("app/(app)/channels/page.tsx", header_channels)]:
    with open(fname, "r", encoding="utf-8") as f:
        c = f.read()
    new_c = re.sub(r'      <div className="flex items-center[^>]*flex-shrink-0">.*?</div>\n      </div>', new_header, c, count=1, flags=re.DOTALL)
    with open(fname, "w", encoding="utf-8") as f:
        f.write(new_c)
    print(fname, "OK")
