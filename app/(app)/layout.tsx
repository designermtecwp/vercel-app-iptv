"use client";
import Sidebar from "@/components/Sidebar";
import { useEffect } from "react";
import { useRouter } from "next/navigation";


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Verificar se DNS do admin mudou — desconectar se sim
    fetch("/api/admin/public").then(r=>r.json()).then(cfg=>{
      if (!cfg.serverDns) return;
      const savedDns = localStorage.getItem("xtream_dns");
      if (savedDns && savedDns !== cfg.serverDns) {
        // DNS mudou — limpar sessão e redirecionar para login
        localStorage.removeItem("xtream_dns");
        localStorage.removeItem("xtream_user");
        localStorage.removeItem("xtream_pass");
        localStorage.removeItem("xtream_info");
        router.replace("/");
      }
    }).catch(()=>{});
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden"
        id="main-content"
        style={{WebkitOverflowScrolling:"touch" as any}}>
        <style>{`
          #main-content { padding-bottom: 90px; }
          @media(min-width:768px){ #main-content { padding-bottom: 0 !important; } }
        `}</style>
        {children}
      </main>
    </div>
  );
}
