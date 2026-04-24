with open("app/(app)/player/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()
# Fix tryPlay para não usar autoplay — esperar interação
c = c.replace(
    "const tryPlay = () => video.play().then(() => { console.log('[PLAYER] playing OK'); setPlaying(true); }).catch((e) => { console.error('[PLAYER] play failed:', e); setStreamError('Erro ao reproduzir: ' + e.message); });",
    """const tryPlay = () => {
      video.muted = false;
      const p = video.play();
      if (p !== undefined) {
        p.then(() => { console.log('[PLAYER] playing OK'); setPlaying(true); })
        .catch(() => {
          // Autoplay bloqueado — tentar com mute primeiro
          video.muted = true;
          video.play().then(() => {
            setPlaying(true);
            // Desmutar apos iniciar
            setTimeout(() => { video.muted = false; }, 500);
          }).catch((e2) => {
            console.error('[PLAYER] play failed muted:', e2);
            setStreamError('Clique em qualquer lugar para reproduzir');
          });
        });
      }
    };"""
)
with open("app/(app)/player/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("OK")
