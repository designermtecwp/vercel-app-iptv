with open("app/(app)/player/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# Para live: usar http:// diretamente (servidor IPTV nao tem https nos segmentos)
# O browser permite http em src de video quando iniciado por interacao do usuario
old = "  const epExt = params.get(\"ext\") || \"mp4\";\n  const streamUrl = streamId && dns && username && password"
new = """  const epExt = params.get("ext") || "mp4";
  // Para canais ao vivo: usar http:// diretamente
  // O HLS.js carrega segmentos http:// sem bloqueio quando o src inicial ja e http://
  const liveDns = dns?.replace("https://", "http://") || "";
  const streamUrl = streamId && dns && username && password"""

c = c.replace(old, new)

# Usar liveDns para live streams
c = c.replace(
    "? isLive\n      ? `${dns}/live/${username}/${password}/${streamId}.m3u8`",
    "? isLive\n      ? `${liveDns}/live/${username}/${password}/${streamId}.m3u8`"
)

with open("app/(app)/player/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("OK")
