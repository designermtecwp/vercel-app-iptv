with open("app/(app)/player/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()
c = c.replace(
    'onClick={togglePlay} playsInline/>',
    'onClick={togglePlay} playsInline autoPlay muted/>'
)
with open("app/(app)/player/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("OK")
