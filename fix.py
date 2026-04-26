with open("app/(app)/channels/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# Fix imagens - usar Replit como proxy para imagens
c = c.replace(
    'src={ch.stream_icon?.startsWith("http://") ? `https://iptv-proxy.luizdori.workers.dev?url=${encodeURIComponent(ch.stream_icon)}` : ch.stream_icon}',
    'src={ch.stream_icon?.startsWith("http://") ? `https://iptv-manager--luizdori.replit.app/api/xtream/stream?url=${encodeURIComponent(ch.stream_icon)}` : ch.stream_icon}'
)

with open("app/(app)/channels/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("OK imagens")
