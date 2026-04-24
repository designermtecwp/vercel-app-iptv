with open("app/(app)/player/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()
c = c.replace(
    "const loadStream = useCallback(async (url: string) => {",
    "const loadStream = useCallback(async (url: string) => {\n    console.log('[PLAYER] loadStream url:', url);"
)
c = c.replace(
    "const tryPlay = () => video.play().then(() => setPlaying(true)).catch(() => {});",
    "const tryPlay = () => video.play().then(() => { console.log('[PLAYER] playing OK'); setPlaying(true); }).catch((e) => { console.error('[PLAYER] play failed:', e); setStreamError('Erro ao reproduzir: ' + e.message); });"
)
with open("app/(app)/player/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("OK")
