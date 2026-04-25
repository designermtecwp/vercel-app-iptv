with open("app/(app)/player/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()
c = c.replace(
    'if (effectiveUrl.includes(".m3u8") || needsProxy) {',
    'if (effectiveUrl.includes(".m3u8") || isLive) {'
)
with open("app/(app)/player/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("OK:", "needsProxy" not in c)
