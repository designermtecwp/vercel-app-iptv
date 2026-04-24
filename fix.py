with open("app/(app)/player/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()
# Sempre usar proxy para live — o m3u8 pode redirecionar para http internamente
old = "    if (url.includes(\".m3u8\") || isLive) {"
new = """    // Para canais ao vivo: sempre passar pelo proxy que reescreve http->https nos segmentos
    const liveUrl = isLive ? `/api/stream?url=${encodeURIComponent(url)}` : url;
    const finalUrl = liveUrl;

    if (finalUrl.includes(".m3u8") || finalUrl.includes("/api/stream")) {"""
c = c.replace(old, new)

# Substituir todas as referencias de 'url' por 'finalUrl' dentro do loadStream
# apenas apos a definicao de finalUrl
c = c.replace("          hls.loadSource(url);", "          hls.loadSource(finalUrl);")
c = c.replace("              video.src = url;\n              tryPlay();", "              video.src = finalUrl;\n              tryPlay();")
c = c.replace("      video.src = url;\n      tryPlay();\n    } else {\n      video.src = url;", "      video.src = finalUrl;\n      tryPlay();\n    } else {\n      video.src = finalUrl;")

with open("app/(app)/player/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("OK")
