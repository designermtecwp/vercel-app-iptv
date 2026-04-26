with open("app/(app)/channels/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()
c = c.replace(
    '''      <div className="flex items-center justify-between px-4 pt-3 pb-2 sm:px-6 sm:pt-5 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-3">
          <h1 className="text-xl font-semibold text-white">Canais ao vivo</h1>
          {channels.length>0&&<span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full border border-white/20">{filtered.length}</span>}
        </div>
        <div className="flex items-center gap-2 flex-1 sm:flex-none">
          <div className="relative flex-1 sm:flex-none">
            <input type="text" placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)}
              className="w-full sm:w-44 bg-zinc-900 border border-zinc-800 text-sm text-white px-3 py-1.5 rounded-xl focus:outline-none focus:border-violet-500 placeholder-zinc-500"/>
          </div>
          <button onClick={()=>setShowCats(true)}
            className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${active!=="all"?"bg-violet-600 border-violet-600 text-white":"bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"}`}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            <span className="max-w-[100px] truncate">{active==="all"?"Categorias":activeCat?.category_name||""}</span>
          </button>
        </div>
      </div>''',
    '''      <div className="flex items-center justify-between px-4 pt-3 pb-2 sm:px-6 sm:pt-5 flex-shrink-0">
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
      </div>'''
)
with open("app/(app)/channels/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("OK:", "Canais ao vivo" in c)
