with open("app/(app)/player/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# Sempre usar proxy para live — resolve Mixed Content independente do protocolo
c = c.replace(
    "    if (url.includes(\".m3u8\") || isLive) {",
    """    // Live: sempre via proxy que reescreve segmentos http->https
    const streamSrc = isLive ? `/api/stream?url=${encodeURIComponent(url)}` : url;
    if (streamSrc.includes("/api/stream") || streamSrc.includes(".m3u8")) {"""
)
c = c.replace(
    "          hls.loadSource(url);",
    "          hls.loadSource(streamSrc);"
)
c = c.replace(
    "              video.src = url;\n              tryPlay();",
    "              video.src = streamSrc;\n              tryPlay();"
)
c = c.replace(
    "      video.src = url;\n      tryPlay();\n    } else {\n      video.src = url;",
    "      video.src = streamSrc;\n      tryPlay();\n    } else {\n      video.src = url;"
)

with open("app/(app)/player/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("OK")
