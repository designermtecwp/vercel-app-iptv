'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [subscriber, setSubscriber] = useState(null);
  const [dns, setDns] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    setSubscriber(JSON.parse(localStorage.getItem('subscriber') || '{}'));
    setDns(JSON.parse(localStorage.getItem('dns') || '{}'));
  }, []);

  function logout() {
    localStorage.clear();
    router.push('/login');
  }

  if (!subscriber) return (
    <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
      <div className="text-white/40">Carregando...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white">
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <span className="text-white font-black text-xs">IP</span>
          </div>
          <span className="font-bold">IPTV Player</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/40 text-sm">Olá, {subscriber.name}</span>
          <button onClick={logout} className="text-white/40 hover:text-white text-sm transition-colors">Sair</button>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Sua Conexão</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/40 text-xs mb-1">DNS Server</p>
              <p className="text-white font-medium">{dns?.name || 'Não configurado'}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs mb-1">URL</p>
              <p className="text-blue-400 text-sm font-mono truncate">{dns?.url || '-'}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs mb-1">Usuário</p>
              <p className="text-white font-medium">{subscriber.username}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs mb-1">Expira em</p>
              <p className="text-white font-medium">{subscriber.expires_at || 'Sem expiração'}</p>
            </div>
          </div>
        </div>

        {dns?.stream_url && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">Stream M3U</h2>
            <p className="text-white/40 text-xs mb-2">Copie a URL abaixo e cole no seu player favorito:</p>
            <div className="bg-black/30 rounded-xl p-3 flex items-center gap-3">
              <p className="text-blue-400 text-xs font-mono flex-1 truncate">{dns.stream_url}</p>
              <button
                onClick={() => navigator.clipboard.writeText(dns.stream_url)}
                className="text-white/40 hover:text-white text-xs bg-white/10 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                Copiar
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
