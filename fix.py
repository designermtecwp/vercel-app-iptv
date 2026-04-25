with open("app/(app)/player/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# Fix 1: streamUrl correto para live (proxy), series e vod
old = """  const streamUrl = streamId && dns && username && password
    ? isLive
      ? `${dns}/live/${username}/${password}/${streamId}.m3u8`
      : `${dns}/movie/${username}/${password}/${streamId}.mp4`
    : null;"""

new = """  const epExt = params.get("ext") || "mp4";
  const streamUrl = streamId && dns && username && password
    ? isLive
      ? `/api/proxy-stream?url=${encodeURIComponent(`${dns}/live/${username}/${password}/${streamId}.m3u8`)}`
      : isSeries
        ? `${dns}/series/${username}/${password}/${streamId}.${epExt}`
        : `${dns}/movie/${username}/${password}/${streamId}.${epExt}`
    : null;"""

c = c.replace(old, new)

# Fix 2: tryPlay simples
c = c.replace(
    'const tryPlay = () => {\n      video.muted = true;\n      video.play()\n        .then(() => { setPlaying(true); setTimeout(() => { video.muted = false; }, 300); })\n        .catch(() => {});\n    };',
    'const tryPlay = () => video.play().then(() => setPlaying(true)).catch(() => {});'
)

# Fix 3: condicao isLive
c = c.replace(
    'if (url.includes(".m3u8")) {',
    'if (url.includes(".m3u8") || isLive) {'
)

with open("app/(app)/player/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)

# Verify
print("proxy-stream:", "proxy-stream" in c)
print("isSeries:", "isSeries" in c)
print("epExt:", "epExt" in c)
