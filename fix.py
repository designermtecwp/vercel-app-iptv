with open("app/(app)/player/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# Fix 1: needsProxy
c = c.replace(
    'if (effectiveUrl.includes(".m3u8") || needsProxy) {',
    'if (effectiveUrl.includes(".m3u8") || isLive) {'
)

# Fix 2: streamError - adicionar state se nao existe
if "streamError, setStreamError" not in c:
    c = c.replace(
        '  const hideTimer = useRef<number | null>(null);',
        '  const [streamError, setStreamError] = useState<string|null>(null);\n  const hideTimer = useRef<number | null>(null);'
    )

with open("app/(app)/player/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("needsProxy gone:", "needsProxy" not in c)
print("streamError exists:", "streamError, setStreamError" in c)
