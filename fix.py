with open("app/(app)/player/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()
c = c.replace(
    '? `${dns}/live/${username}/${password}/${streamId}.m3u8`',
    '? `/api/stream?url=${encodeURIComponent(`${dns}/live/${username}/${password}/${streamId}.m3u8`)}`'
)
c = c.replace(
    'const newUrl = `${dns}/live/${username}/${password}/${ch.stream_id}.m3u8`;',
    'const newUrl = `/api/stream?url=${encodeURIComponent(`${dns}/live/${username}/${password}/${ch.stream_id}.m3u8`)}`;'
)
with open("app/(app)/player/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("OK")
