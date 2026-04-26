# Series
with open("app/(app)/series/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()
c = c.replace(
    'className="flex items-center gap-2 px-4 pt-3 pb-2 sm:px-6 sm:pt-5 flex-shrink-0"',
    'className="flex items-center justify-between px-4 pt-3 pb-2 sm:px-6 sm:pt-5 flex-shrink-0"'
)
c = c.replace(
    'className="hidden sm:flex items-center gap-3 mr-auto"',
    'className="hidden sm:flex items-center gap-3"'
)
c = c.replace(
    'showCats||genre!=="all" ? "bg-violet-600 border-violet-600 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600"',
    'genre!=="all"?"bg-violet-600 border-violet-600 text-white":"bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"'
)
with open("app/(app)/series/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)

# Channels
with open("app/(app)/channels/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()
c = c.replace(
    'className="flex items-center gap-2 px-4 pt-3 pb-2 sm:px-6 sm:pt-5 flex-shrink-0"',
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
