with open("app/(app)/player/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()
# Adicionar state faltando
c = c.replace(
    '  const [seriesEps, setSeriesEps] = useState<{id:number;title:string;episode_num:number;season:number}[]>([]);',
    '  const [seriesEps, setSeriesEps] = useState<{id:number;title:string;episode_num:number;season:number}[]>([]);\n  const [streamError, setStreamError] = useState<string|null>(null);'
)
with open("app/(app)/player/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("streamError:", "streamError, setStreamError" in open("app/(app)/player/page.tsx").read())
