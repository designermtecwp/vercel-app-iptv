for fname in ["app/(app)/movies/page.tsx", "app/(app)/series/page.tsx", "app/(app)/channels/page.tsx"]:
    with open(fname, "r", encoding="utf-8") as f:
        c = f.read()
    c = c.replace(
        'flex items-center gap-2 text-sm px-3 py-2 rounded-xl border transition-all whitespace-nowrap',
        'flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap'
    )
    c = c.replace(
        'flex items-center gap-3.5 text-sm px-4 py-2 rounded-xl border transition-all flex-shrink-0',
        'flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl border transition-all flex-shrink-0'
    )
    c = c.replace(
        'flex items-center gap-2 text-sm px-4 py-2 rounded-xl border transition-all flex-shrink-0',
        'flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl border transition-all flex-shrink-0'
    )
    with open(fname, "w", encoding="utf-8") as f:
        f.write(c)
    print(fname, "OK")
