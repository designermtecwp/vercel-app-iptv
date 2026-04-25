with open("app/(app)/player/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()
# Trocar .m3u8 por .ts para canais ao vivo
c = c.replace(
    '? `${dns}/live/${username}/${password}/${streamId}.m3u8`',
    '? `${dns}/live/${username}/${password}/${streamId}.ts`'
)
c = c.replace(
    'const newUrl = `${dns}/live/${username}/${password}/${ch.stream_id}.m3u8`;',
    'const newUrl = `${dns}/live/${username}/${password}/${ch.stream_id}.ts`;'
)
# Para .ts nao precisa de HLS.js — usar video.src direto
c = c.replace(
    'if (url.includes(".m3u8") || isLive) {',
    'if (url.includes(".m3u8")) {'
)
with open("app/(app)/player/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("OK")
