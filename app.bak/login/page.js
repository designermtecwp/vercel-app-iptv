'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, ok } = await login(username, password);
    if (ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('password', password);
      localStorage.setItem('subscriber', JSON.stringify(data.subscriber));
      localStorage.setItem('dns', JSON.stringify(data.dns));
      router.push('/');
    } else {
      setError(data.message || 'Erro ao fazer login.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <span className="text-white font-black text-xl">IP</span>
          </div>
          <h1 className="text-white text-2xl font-bold">IPTV Player</h1>
          <p className="text-white/40 text-sm mt-1">Entre com suas credenciais</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-3">
              {error}
            </div>
          )}
          <div>
            <label className="text-white/60 text-xs font-medium block mb-1.5">Usuário</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500/50 transition-colors"
              placeholder="seu_usuario"
              required
            />
          </div>
          <div>
            <label className="text-white/60 text-xs font-medium block mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500/50 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
