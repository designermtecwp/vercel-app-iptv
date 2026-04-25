with open("app/(app)/player/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

old = '? `${dns}/live/${username}/${password}/${streamId}.m3u8`'
new = '? `/api/stream?url=${encodeURIComponent(`${dns}/live/${username}/${password}/${streamId}.m3u8`)}`'

old2 = 'const newUrl = `${dns}/live/${username}/${password}/${ch.stream_id}.m3u8`;'
new2 = 'const newUrl = `/api/stream?url=${encodeURIComponent(`${dns}/live/${username}/${password}/${ch.stream_id}.m3u8`)}`;'

c = c.replace(old, new)
c = c.replace(old2, new2)

with open("app/(app)/player/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)

print("proxy m3u8:", "/api/stream" in c)
