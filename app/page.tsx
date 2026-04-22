"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";



export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loginLogo, setLoginLogo] = useState("");
  const [serverDns, setServerDns] = useState("");
  const [loginTitle, setLoginTitle] = useState("");
  const [loginSubtitle, setLoginSubtitle] = useState("");
  const router = useRouter();

  useEffect(() => {
    const dns = localStorage.getItem("xtream_dns");
    const user = localStorage.getItem("xtream_user");
    const pass = localStorage.getItem("xtream_pass");
    fetch("/api/admin/public").then(r=>r.json()).then(cfg=>{
      if(cfg.loginLogo) setLoginLogo(cfg.loginLogo);
      if(cfg.serverDns) setServerDns(cfg.serverDns);
      if(cfg.loginTitle) setLoginTitle(cfg.loginTitle);
      if(cfg.loginSubtitle) setLoginSubtitle(cfg.loginSubtitle);
    }).catch(()=>{});
    if (dns && user && pass) {
      router.replace("/home");
    } else {
      setChecking(false);
    }
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    try {
      const apiUrl = `${serverDns}/player_api.php?username=${encodeURIComponent(username.trim())}&password=${encodeURIComponent(password.trim())}`;
      let data: any = null;
      // Tentar direto primeiro
      try {
        const resDirect = await fetch(apiUrl, { signal: AbortSignal.timeout(8000), headers: {"Accept":"application/json"} });
        if (resDirect.ok) data = await resDirect.json();
      } catch {}
      // Fallback proxy
      if (!data) {
        const res = await fetch(`/api/proxy?url=${encodeURIComponent(apiUrl)}`, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) throw new Error("Erro na conexão");
        data = await res.json();
      }
      if (!data || data.user_info?.auth === 0 || data.user_info?.auth === "0")
        throw new Error("Usuário ou senha incorretos");
      if (!data.user_info) throw new Error("Servidor não retornou dados válidos");
      localStorage.setItem("xtream_dns", serverDns);
      localStorage.setItem("xtream_user", username.trim());
      localStorage.setItem("xtream_pass", password.trim());
      localStorage.setItem("xtream_info", JSON.stringify(data.user_info));
      router.replace("/home");
    } catch (err: any) {
      setError(err.name === "TimeoutError" || err.message.includes("fetch")
        ? "Não foi possível conectar ao servidor."
        : err.message || "Erro ao conectar");
      setLoading(false);
    }
  }

  // Tela preta enquanto verifica sessão — elimina flash de login
  if (checking) {
    return <div className="min-h-screen bg-black"/>;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          {loginLogo ? (
            <div className="flex items-center justify-center mx-auto mb-4 h-20">
              <img src={loginLogo} alt="logo" className="max-h-20 max-w-48 object-contain"/>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto mb-4 text-xl font-bold text-white">
              IP
            </div>
          )}
          {loginTitle && <h1 className="text-2xl font-semibold text-white">{loginTitle}</h1>}
          {loginSubtitle && <p className="text-sm text-zinc-500 mt-1">{loginSubtitle}</p>}
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3">
          {/* Usuário */}
          <div>
            <label className="block text-xs text-zinc-400 mb-2 font-medium uppercase tracking-wider">Usuário</label>
            <div className="relative">
              <input
                type="text" inputMode="text"
                value={username}
                onChange={e => setUsername(e.target.value)} onInput={e => setUsername((e.target as HTMLInputElement).value)}
                placeholder="SEU USUÁRIO"
                required
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-violet-500 transition-colors"
              />
              {username.length > 0 && (
                <button type="button" onClick={() => setUsername("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>
          </div>

          {/* Senha */}
          <div>
            <label className="block text-xs text-zinc-400 mb-2 font-medium uppercase tracking-wider">Senha</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)} onInput={e => setPassword((e.target as HTMLInputElement).value)}
                placeholder="SUA SENHA"
                required
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 rounded-xl px-4 py-3 pr-20 text-sm focus:outline-none focus:border-violet-500 transition-colors"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {password.length > 0 && (
                  <button type="button" onClick={() => setPassword("")}
                    className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                )}
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                  {showPass
                    ? <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
                    : <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading || !username.trim() || !password.trim() || !serverDns}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl text-sm transition-colors mt-2">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75"/>
                </svg>
                Conectando...
              </span>
            ) : "Entrar"}
          </button>
        </form>

        
      </div>
    </div>
  );
}
