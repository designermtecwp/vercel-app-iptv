import re
with open('app/(app)/player/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace('const needsProxy = isLive && url.startsWith("http://");\n    const effectiveUrl = needsProxy\n      ? `/api/stream?url=${encodeURIComponent(url)}`\n      : url;', 'const effectiveUrl = url;')
c = c.replace('effectiveUrl.includes(".m3u8") || needsProxy', 'effectiveUrl.includes(".m3u8") || isLive')
with open('app/(app)/player/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
