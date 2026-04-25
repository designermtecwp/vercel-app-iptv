with open("app/(app)/player/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()
c = c.replace(
    '? `/api/stream?url=${encodeURIComponent(`${dns}/live/${username}/${password}/${streamId}.m3u8`)}`',
    '? `/api/proxy-stream?url=${encodeURIComponent(`${dns}/live/${username}/${password}/${streamId}.m3u8`)}`'
)
with open("app/(app)/player/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("OK:", "proxy-stream" in c)
