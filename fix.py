with open("app/(app)/player/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# Fix 1: tryPlay sem muted
c = c.replace(
    'const tryPlay = () => {\n      video.muted = true;\n      video.play()\n        .then(() => { setPlaying(true); setTimeout(() => { video.muted = false; }, 300); })\n        .catch(() => {});\n    };',
    'const tryPlay = () => video.play().then(() => setPlaying(true)).catch(() => {});'
)

# Fix 2: condicao correta
c = c.replace(
    'if (url.includes(".m3u8")) {',
    'if (url.includes(".m3u8") || isLive) {'
)

with open("app/(app)/player/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("OK")
