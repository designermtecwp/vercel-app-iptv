"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
const navItems = [
  { href: "/search", label: "Buscar", d: "M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" },
  { href: "/home", label: "Início", d: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
  { href: "/channels", label: "Canais", d: "M2 7h20v15H2zM16 3l-4 4-4-4" },
  { href: "/movies", label: "Filmes", d: "M23 7l-7 5 7 5V7zM1 5h15v14H1z" },
  { href: "/series", label: "Séries", d: "M2 2h20v20H2zM7 2v20M17 2v20M2 12h20" },
  { href: "/favorites", label: "Favoritos", d: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" },
  { href: "/settings", label: "Config", d: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" },
  { href: "/profile", label: "Perfil", d: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" },
];
export default function Sidebar() {
  const pathname = usePathname();
  const [logoUrl, setLogoUrl] = useState("");
  useEffect(() => {
    fetch("/api/admin/public").then(r=>r.json()).then(cfg=>{
      if(cfg.appLogo) setLogoUrl(cfg.appLogo);
    }).catch(()=>{});
  }, []);
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-16 bg-zinc-950 border-r border-zinc-900 flex-col items-center py-4 flex-shrink-0">
        {logoUrl && (
          <div className="w-10 h-10 mb-2 flex items-center justify-center overflow-hidden">
            <img src={logoUrl} alt="logo" className="w-full h-full object-contain"/>
          </div>
        )}
        <Link href="/profile" title="Perfil"
          className={`w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center mb-6 hover:bg-violet-500 transition-colors ${pathname==="/profile"?"ring-2 ring-violet-400":""}`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </Link>
        <nav className="flex flex-col gap-1.5 flex-1 items-center justify-center">
          {navItems.filter(i=>i.href!=="/profile").map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href+"/");
            return (
              <Link key={item.href} href={item.href} title={item.label}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${active?"bg-violet-600 text-white":"text-zinc-500 hover:text-white hover:bg-zinc-800"}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d={item.d}/>
                </svg>
              </Link>
            );
          })}
        </nav>
        {/* Botão minimizar/fechar app — só fecha a aba, não desloga */}
        <button onClick={()=>window.location.reload()} title="Recarregar app" className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors mt-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        </button>
      </aside>

      {/* Mobile bottom nav */}
      {logoUrl && pathname === "/home" && (
        <div className="md:hidden fixed top-3 left-3 z-30 pointer-events-none">
          <img src={logoUrl} alt="logo" className="h-12 w-auto object-contain max-w-[120px]"/>
        </div>
      )}
      <nav className="md:hidden fixed z-30"
        style={{bottom:"12px",left:"50%",transform:"translateX(-50%)",background:"rgba(14,14,14,0.95)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"50px",boxShadow:"0 8px 40px rgba(0,0,0,0.7)",padding:"6px 12px"}}>
        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar" style={{maxWidth:"calc(100vw - 48px)"}}>
          {navItems.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href+"/");
            return (
              <Link key={item.href} href={item.href}
                className="flex-shrink-0 flex flex-col items-center gap-0.5 relative"
                style={{padding:"6px 10px", minWidth:"52px"}}>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-violet-500 rounded-full"/>
                )}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
                  className="w-5 h-5 transition-colors"
                  style={{color: active ? "#a78bfa" : "#52525b"}}>
                  <path d={item.d}/>
                </svg>
                <span className="text-[9px] font-medium transition-colors"
                  style={{color: active ? "#a78bfa" : "#52525b"}}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          <button onClick={()=>window.location.reload()}
            className="flex-shrink-0 flex flex-col items-center gap-0.5"
            style={{padding:"6px 10px", minWidth:"52px"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
              className="w-5 h-5" style={{color:"#52525b"}}>
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            <span className="text-[9px] font-medium" style={{color:"#52525b"}}>Recarregar</span>
          </button>
        </div>
      </nav>
    </>
  );
}
