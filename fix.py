with open("app/(app)/channels/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()
c = c.replace(
    '<span className="max-w-[100px] truncate">{active==="all"?"Categorias":activeCat?.category_name||""}</span>',
    '<span className="hidden sm:inline max-w-[100px] truncate">{active==="all"?"Categorias":activeCat?.category_name||""}</span>'
)
with open("app/(app)/channels/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("OK")
