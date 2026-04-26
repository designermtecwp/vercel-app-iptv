with open("app/(app)/channels/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    'className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${active!=="all"?"bg-violet-600 border-violet-600 text-white":"bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"}`}>\n            <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>\n            <span className="hidden sm:inline max-w-[100px] truncate">{active==="all"?"Categorias":activeCat?.category_name||""}</span>',
    'className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${active!=="all"?"bg-violet-600 border-violet-600 text-white":"bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"}`}>\n            <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>\n            <span className="hidden sm:inline max-w-[100px] truncate">{active==="all"?"Categorias":activeCat?.category_name||""}</span>'
)

with open("app/(app)/channels/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("OK")
