with open('app/(app)/player/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace(
    '  const [seriesEps, setSeriesEps] = useState<{id:number;title:string;episode_num:number;season:number}[]>([]);',
    '  const [seriesEps, setSeriesEps] = useState<{id:number;title:string;episode_num:number;season:number}[]>([]);\n  const [streamError, setStreamError] = useState<string|null>(null);'
)
c = c.replace(
    'if (d.fatal) {\n              hls.destroy();\n              video.src = effectiveUrl;\n              tryPlay();\n            }',
    'if (d.fatal) {\n              hls.destroy();\n              if (video.canPlayType("application/vnd.apple.mpegurl")) {\n                video.src = effectiveUrl;\n                tryPlay();\n              } else {\n                setStreamError("Nao foi possivel carregar o canal.");\n              }\n            }'
)
c = c.replace(
    '{/* Modal continuar assistindo */}',
    '{streamError && (<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px",zIndex:25,background:"rgba(0,0,0,0.75)"}}><p style={{color:"white",fontSize:"14px"}}>{streamError}</p><button onClick={()=>{setStreamError(null);if(streamUrl)loadStream(streamUrl);}} style={{background:"#7c3aed",color:"#fff",border:"none",borderRadius:"8px",padding:"10px 24px",cursor:"pointer"}}>Tentar novamente</button></div>)}\n        {/* Modal continuar assistindo */}'
)
with open('app/(app)/player/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
