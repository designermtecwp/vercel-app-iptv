with open("app/(app)/channels/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()
# Forca mudança minima para novo deploy
c = c.replace(
    'placeholder="Buscar" value={search} onChange={e=>setSearch(e.target.value)}',
    'placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)}'
)
with open("app/(app)/channels/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("OK")
