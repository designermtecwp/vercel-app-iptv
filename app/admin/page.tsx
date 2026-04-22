"use client";
import { useState, useEffect } from "react";

interface Config {
  loginLogo?: string;
  loginTitle?: string;
  loginSubtitle?: string;
  appName: string;
  appLogo: string;
  serverDns: string;
  serverDnsList: string[];
  primaryColor: string;
  welcomeMessage: string;
  notification: string;
  allowedUsers: string[];
  appDomain?: string;
}

export default function AdminPage() {
  const [pass, setPass] = useState(() => typeof window !== "undefined" ? localStorage.getItem("admin_pass") || "" : "");
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [config, setConfig] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"ok"|"err"|"info">("ok");
  const [newUser, setNewUser] = useState("");
  const [newDns, setNewDns] = useState("");
  const [showJson, setShowJson] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("admin_pass");
    if (saved) {
      setPass(saved);
      fetch(`/api/admin?pass=${saved}`)
        .then(r => r.ok ? r.json() : null)
        .then(cfg => { if (cfg) { setConfig({ serverDnsList: [], ...cfg }); setAuthed(true); } setChecking(false); })
        .catch(() => setChecking(false));
    } else { setChecking(false); }
  }, []);

  async function login() {
    const res = await fetch(`/api/admin?pass=${pass}`);
    if (res.ok) {
      const cfg = await res.json();
      setConfig({ serverDnsList: [], ...cfg });
      setAuthed(true);
      localStorage.setItem("admin_pass", pass);
    } else { setMsg("Senha incorreta"); setMsgType("err"); }
  }

  async function save() {
    if (!config) return;
    setSaving(true);
    const res = await fetch(`/api/admin?pass=${pass}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    const data = await res.json();
    setSaving(false);
    if (data.vercel) {
      // Show JSON to copy into env var
      setShowJson(JSON.stringify(data.config, null, 2));
      setMsg("Copie o JSON abaixo e cole em ADMIN_CONFIG na Vercel, depois faça Redeploy.");
      setMsgType("info");
    } else if (data.ok) {
      setMsg("✓ Salvo com sucesso!");
      setMsgType("ok");
      setTimeout(() => setMsg(""), 3000);
    } else {
      setMsg("Erro ao salvar");
      setMsgType("err");
    }
  }

  function addDns() {
    if (!newDns.trim() || !config) return;
    const dns = newDns.trim().replace(/\/$/, "");
    if (config.serverDnsList.includes(dns)) return;
    setConfig({ ...config, serverDnsList: [...config.serverDnsList, dns] });
    setNewDns("");
  }

  function removeDns(i: number) {
    if (!config) return;
    const list = config.serverDnsList.filter((_, j) => j !== i);
    const active = config.serverDns === config.serverDnsList[i] ? (list[0] || "") : config.serverDns;
    setConfig({ ...config, serverDnsList: list, serverDns: active });
  }

  function setActiveDns(dns: string) {
    if (!config) return;
    setConfig({ ...config, serverDns: dns });
  }

  if (checking) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  if (!authed) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h1 className="text-xl font-bold text-white">Painel Admin</h1>
          <p className="text-sm text-zinc-500 mt-1">Acesso restrito</p>
        </div>
        <input type="password" value={pass} onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === "Enter" && login()}
          placeholder="Senha do administrador"
          className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-violet-500 mb-3"/>
        {msg && <p className="text-red-400 text-xs mb-3">{msg}</p>}
        <button onClick={login} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 rounded-xl text-sm transition-colors">
          Entrar
        </button>
      </div>
    </div>
  );

  if (!config) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-white">Painel Admin</h1>
            <p className="text-sm text-zinc-500">Configurações do IPTV Player</p>
          </div>
          <button onClick={save} disabled={saving}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2">
            {saving ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75"/></svg>Salvando...</> : "Salvar tudo"}
          </button>
        </div>

        {msg && (
          <div className={`border text-sm px-4 py-3 rounded-xl mb-6 ${msgType === "ok" ? "bg-green-600/20 border-green-500/30 text-green-300" : msgType === "err" ? "bg-red-600/20 border-red-500/30 text-red-300" : "bg-violet-600/20 border-violet-500/30 text-violet-300"}`}>
            {msg}
          </div>
        )}

        {/* JSON to copy for Vercel */}
        {showJson && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Cole isso em ADMIN_CONFIG na Vercel</p>
              <button onClick={() => { navigator.clipboard.writeText(showJson); setMsg("✓ Copiado!"); setMsgType("ok"); setTimeout(() => setMsg(""), 2000); }}
                className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg transition-colors">
                Copiar
              </button>
            </div>
            <pre className="text-xs text-zinc-300 overflow-auto max-h-48 bg-zinc-800 rounded-xl p-3">{showJson}</pre>
          </div>
        )}

        <div className="space-y-4">

          {/* Identidade */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>
              Identidade do App
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Nome do app</label>
                <input value={config.appName} onChange={e => setConfig({ ...config, appName: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-violet-500"/>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Logo do menu lateral (URL)</label>
                <input value={config.appLogo} onChange={e => setConfig({ ...config, appLogo: e.target.value })}
                  placeholder="https://..." className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-violet-500 mb-2"/>
                {config.appLogo && <img src={config.appLogo} className="h-10 object-contain rounded" alt="preview"/>}
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Logo da página de login (URL)</label>
                <input value={config.loginLogo || ""} onChange={e => setConfig({ ...config, loginLogo: e.target.value } as any)}
                  placeholder="https://..." className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-violet-500 mb-2"/>
                {config.loginLogo && <img src={config.loginLogo} className="h-10 object-contain rounded" alt="preview"/>}
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Título da página de login</label>
                <input value={config.loginTitle || ""} onChange={e => setConfig({ ...config, loginTitle: e.target.value } as any)}
                  placeholder="IPTV Player" className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-violet-500"/>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Subtítulo da página de login</label>
                <input value={config.loginSubtitle || ""} onChange={e => setConfig({ ...config, loginSubtitle: e.target.value } as any)}
                  placeholder="Conecte ao seu servidor" className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-violet-500"/>
              </div>
            </div>
          </div>

          {/* Servidores DNS */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              Servidores IPTV
            </h2>
            <p className="text-xs text-zinc-500 mb-4">Adicione múltiplos servidores. O ativo é usado no login.</p>

            {/* Active DNS display */}
            {config.serverDns && (
              <div className="flex items-center gap-2 bg-violet-600/15 border border-violet-500/30 rounded-xl px-3 py-2.5 mb-4">
                <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"/>
                <span className="text-sm text-violet-300 font-medium flex-1 truncate">{config.serverDns}</span>
                <span className="text-xs text-violet-400 flex-shrink-0">ativo</span>
              </div>
            )}

            {/* DNS list */}
            <div className="space-y-2 mb-4">
              {config.serverDnsList.map((dns, i) => (
                <div key={i} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 border ${dns === config.serverDns ? "bg-violet-600/10 border-violet-500/20" : "bg-zinc-800 border-zinc-700"}`}>
                  <button onClick={() => setActiveDns(dns)}
                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${dns === config.serverDns ? "border-violet-400 bg-violet-400" : "border-zinc-500 hover:border-violet-400"}`}/>
                  <span className="text-sm text-zinc-200 flex-1 truncate font-mono">{dns}</span>
                  <button onClick={() => removeDns(i)} className="text-zinc-500 hover:text-red-400 transition-colors flex-shrink-0">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              ))}
              {config.serverDnsList.length === 0 && (
                <p className="text-xs text-zinc-600 text-center py-3">Nenhum servidor adicionado</p>
              )}
            </div>

            {/* Add DNS */}
            <div className="flex gap-2">
              <input value={newDns} onChange={e => setNewDns(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addDns()}
                placeholder="http://servidor.com ou http://ip:porta"
                className="flex-1 bg-zinc-800 border border-zinc-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-violet-500 font-mono"/>
              <button onClick={addDns} className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl text-sm transition-colors flex-shrink-0">
                Adicionar
              </button>
            </div>
            <p className="text-xs text-zinc-600 mt-2">Clique no círculo para definir qual servidor fica ativo no login</p>
          </div>

          {/* Notificação */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
              Notificação para usuários
            </h2>
            <textarea value={config.notification} onChange={e => setConfig({ ...config, notification: e.target.value })}
              placeholder="Mensagem que aparece para todos os usuários ao abrir o app..."
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-violet-500 resize-none"/>
          </div>

          {/* Boas-vindas */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              Mensagem de boas-vindas
            </h2>
            <textarea value={config.welcomeMessage} onChange={e => setConfig({ ...config, welcomeMessage: e.target.value })}
              placeholder="Mensagem exibida na tela de login..."
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-violet-500 resize-none"/>
          </div>

          {/* Usuários */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
              Usuários permitidos
            </h2>
            <p className="text-xs text-zinc-500 mb-3">Deixe vazio para permitir qualquer usuário</p>
            <div className="flex gap-2 mb-3">
              <input value={newUser} onChange={e => setNewUser(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && newUser.trim()) { setConfig({ ...config, allowedUsers: [...config.allowedUsers, newUser.trim()] }); setNewUser(""); } }}
                placeholder="Nome de usuário..."
                className="flex-1 bg-zinc-800 border border-zinc-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-violet-500"/>
              <button onClick={() => { if (newUser.trim()) { setConfig({ ...config, allowedUsers: [...config.allowedUsers, newUser.trim()] }); setNewUser(""); } }}
                className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl text-sm transition-colors">
                Adicionar
              </button>
            </div>
            <div className="space-y-1.5">
              {config.allowedUsers.map((u, i) => (
                <div key={i} className="flex items-center justify-between bg-zinc-800 px-3 py-2 rounded-lg">
                  <span className="text-sm text-white">{u}</span>
                  <button onClick={() => setConfig({ ...config, allowedUsers: config.allowedUsers.filter((_, j) => j !== i) })}
                    className="text-zinc-500 hover:text-red-400 transition-colors">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              ))}
              {config.allowedUsers.length === 0 && <p className="text-xs text-zinc-600 text-center py-2">Nenhum usuário restrito</p>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
