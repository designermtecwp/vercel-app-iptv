import shutil, os
src = r"C:\Users\luizd\Downloads\player_page.tsx"
dst = r"app\(app)\player\page.tsx"
if os.path.exists(src):
    shutil.copy2(src, dst)
    print("player copiado")
else:
    print("player nao encontrado, pulando")

# Fix channels - remover proxyUrl
with open(r"app\(app)\channels\page.tsx", "r", encoding="utf-8") as f:
    c = f.read()
for old, new in [
    ('function proxyUrl(url: string): string {\n  if (!url) return "";\n  if (url.startsWith("http://")) return `/api/img?url=${encodeURIComponent(url)}`;\n  return url;\n}\n', ''),
    ('function proxyUrl(url: string): string {\n  if (!url) return url;\n  if (url.startsWith("http://")) return `/api/img?url=${encodeURIComponent(url)}`;\n  return url;\n}\n\n', ''),
    ('src={proxyUrl(ch.stream_icon)}', 'src={ch.stream_icon}'),
]:
    c = c.replace(old, new)
with open(r"app\(app)\channels\page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("channels OK, proxyUrl:", "proxyUrl" in c)
