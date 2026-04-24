with open("app/(app)/player/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()
c = c.replace(
    "const effectiveUrl = url;\n\n    const tryPlay",
    'const needsRewrite = isLive && url.startsWith("http://");\n    const effectiveUrl = needsRewrite ? `/api/stream?url=${encodeURIComponent(url)}` : url;\n\n    const tryPlay'
)
c = c.replace(
    'effectiveUrl.includes(".m3u8") || isLive)',
    'effectiveUrl.includes(".m3u8") || effectiveUrl.includes("/api/stream") || isLive)'
)
with open("app/(app)/player/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("player OK")
