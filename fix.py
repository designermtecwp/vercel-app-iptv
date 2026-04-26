for fname in ["app/(app)/movies/page.tsx", "app/(app)/series/page.tsx", "app/(app)/channels/page.tsx"]:
    with open(fname, "r", encoding="utf-8") as f:
        c = f.read()
    # Remover o SVG da lupa que esta dentro do div relativo
    import re
    c = re.sub(
        r'\s*<svg className="absolute left-2\.5[^/]*/></svg>\n',
        '\n',
        c
    )
    # Corrigir pl- para px- no input (remover padding-left extra da lupa)
    c = c.replace('text-white pl-8 pr-4', 'text-white px-3')
    c = c.replace('text-white pl-9 pr-4', 'text-white px-3')
    with open(fname, "w", encoding="utf-8") as f:
        f.write(c)
    print(fname, "OK")
