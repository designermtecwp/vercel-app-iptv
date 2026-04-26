import re
for fname in ["app/(app)/movies/page.tsx", "app/(app)/series/page.tsx", "app/(app)/channels/page.tsx"]:
    with open(fname, "r", encoding="utf-8") as f:
        c = f.read()
    c = re.sub(r'\s*<svg className="absolute[^"]*"[^>]*>.*?</svg>\n', '\n', c, flags=re.DOTALL)
    with open(fname, "w", encoding="utf-8") as f:
        f.write(c)
    print(fname, "OK")
