import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IPTV Player",
  description: "Sua plataforma de streaming",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IPTV Player",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "screen-orientation": "portrait",
    "msapplication-TileColor": "#7c3aed",
  },
};

export const viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  orientationLock: "portrait",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml"/>
        <link rel="apple-touch-icon" href="/icon.svg"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
      </head>
      <body className={`${inter.className} bg-black text-white min-h-screen antialiased`}>
        {children}
        <script dangerouslySetInnerHTML={{__html: `
            try { screen.orientation.lock("portrait").catch(()=>{}); } catch(e) {}
            // Limpar overrides de cor que ficaram do painel admin antigo
            try {
              var s = document.getElementById("admin-color");
              if(s) s.remove();
              var s2 = document.getElementById("admin-theme");
              if(s2) s2.remove();
              document.documentElement.style.removeProperty("--p");
              document.documentElement.style.removeProperty("--primary");
              document.documentElement.style.removeProperty("--color-violet-400");
              document.documentElement.style.removeProperty("--color-violet-500");
              document.documentElement.style.removeProperty("--color-violet-600");
            } catch(e) {}
            // Aplicar configurações admin
            (function(){
              fetch("/api/admin/public").then(function(r){return r.json();}).then(function(cfg){
                if(cfg.appName) document.title=cfg.appName;
              }).catch(function(){});
            })();
            });

          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(()=>{});
            });
          }
          // TV D-pad navigation — spatial (2D)
          // TV D-pad - suporte a keyCodes de controle remoto Android TV
          var lastKey = 0;
          document.addEventListener('keyup', function(e) {
            var keyMap = {
              19: 'ArrowUp', 20: 'ArrowDown', 21: 'ArrowLeft', 22: 'ArrowRight',
              23: 'Enter', 66: 'Enter', 4: 'Backspace', 111: 'Backspace',
              164: 'Enter', 85: 'Enter'
            };
            if (e.keyCode && keyMap[e.keyCode]) {
              var mapped = new KeyboardEvent('keydown', { key: keyMap[e.keyCode], bubbles: true });
              document.dispatchEvent(mapped);
            }
          });
          // Inicializar foco automaticamente
          setTimeout(function() {
            var focusable = document.querySelector('a[href], button:not([disabled]), [tabindex="0"]');
            if (focusable) focusable.focus();
          }, 500);
          document.addEventListener('keydown', function(e) {
            const keys = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' ','Backspace','Escape'];
            if (!keys.includes(e.key)) return;

            // Throttle para evitar lentidão
            var now = Date.now();
            if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Backspace' && e.key !== 'Escape') {
              if (now - lastKey < 80) return;
              lastKey = now;
            }

            if (e.key === 'Backspace' || e.key === 'Escape') { e.preventDefault(); window.history.back(); return; }
            if (e.key === 'Enter' || e.key === ' ') {
              const cur = document.activeElement;
              if (cur && cur !== document.body) { e.preventDefault(); cur.click(); }
              else {
                // Se nenhum elemento focado, focar o primeiro
                const focusable = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
                const first = document.querySelector(focusable);
                if (first) first.focus();
              }
              return;
            }

            e.preventDefault();
            const focusable = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"]), div[onclick], li[onclick]';
            const els = Array.from(document.querySelectorAll(focusable)).filter(function(el) {
              const r = el.getBoundingClientRect();
              const s = window.getComputedStyle(el);
              return r.width > 0 && r.height > 0 && r.top < window.innerHeight && r.bottom > 0 && r.left < window.innerWidth && r.right > 0 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0';
            });

            const cur = document.activeElement;
            if (!cur || cur === document.body) {
              const first = els[0];
              if (first) { first.focus(); first.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
              return;
            }

            const curR = cur.getBoundingClientRect();
            const curCX = curR.left + curR.width / 2;
            const curCY = curR.top + curR.height / 2;

            let best = null, bestScore = Infinity;
            for (const el of els) {
              if (el === cur || cur.contains(el) || el.contains(cur)) continue;
              const r = el.getBoundingClientRect();
              const cx = r.left + r.width / 2;
              const cy = r.top + r.height / 2;
              const dx = cx - curCX;
              const dy = cy - curCY;

              let inDir = false;
              if (e.key === 'ArrowRight' && dx > 5) inDir = true;
              if (e.key === 'ArrowLeft' && dx < -5) inDir = true;
              if (e.key === 'ArrowDown' && dy > 5) inDir = true;
              if (e.key === 'ArrowUp' && dy < -5) inDir = true;
              if (!inDir) continue;

              const primary = (e.key === 'ArrowRight' || e.key === 'ArrowLeft') ? Math.abs(dx) : Math.abs(dy);
              const secondary = (e.key === 'ArrowRight' || e.key === 'ArrowLeft') ? Math.abs(dy) : Math.abs(dx);
              const score = primary + secondary * 1.5;
              if (score < bestScore) { bestScore = score; best = el; }
            }
            if (best) {
              best.focus();
              best.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          });
        `}}/>
      </body>
    </html>
  );
}
