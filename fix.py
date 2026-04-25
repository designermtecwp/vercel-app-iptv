# Series
with open("app/(app)/series/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()
old = '''          <button onClick={()=>setShowCats(true)}
            className={`flex items-center justify-center p-1.5 rounded-xl border transition-all flex-shrink-0 ${showCats||genre!=="all" ? "bg-violet-600 border-violet-600 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600"}`}>
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </button>'''
new = '''          <button onClick={()=>setShowCats(true)}
            className={`flex items-center justify-center p-1.5 rounded-xl border transition-all ${genre!=="all"?"bg-violet-600 border-violet-600 text-white":"bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"}`}>
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </button>'''
c = c.replace(old, new)
with open("app/(app)/series/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)

# Channels header
with open("app/(app)/channels/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()
c = c.replace(
    'className="flex items-center gap-2 px-4 pt-4 pb-3 sm:px-6 sm:pt-8 flex-shrink-0"',
    'className="flex items-center justify-between px-4 pt-3 pb-2 sm:px-6 sm:pt-5 flex-shrink-0"'
)
c = c.replace(
    'className="hidden sm:flex items-center gap-3 mr-auto"',
    'className="hidden sm:flex items-center gap-3"'
)
c = c.replace(
    'showCats||active!=="all" ? "bg-violet-600 border-violet-600 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600"',
    'active!=="all"?"bg-violet-600 border-violet-600 text-white":"bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"'
)
with open("app/(app)/channels/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)

print("OK")
