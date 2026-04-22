"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [dns, setDns] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedDns = localStorage.getItem("xtream_dns") || "";
    const username = localStorage.getItem("xtream_user") || "";
    const password = localStorage.getItem("xtream_pass") || "";
    setDns(storedDns);

    if (!storedDns || !username || !password) {
      router.replace("/");
      return;
    }

    // Buscar dados frescos do servidor
    fetch(`/api/proxy?url=${encodeURIComponent(`${storedDns}/player_api.php?username=${username}&password=${password}`)}`)
      .then(r => r.json())
      .then(data => {
        if (data?.user_info) {
          setUser(data.user_info);
          localStorage.setItem("xtream_info", JSON.stringify(data.user_info));
        }
      })
      .catch(() => {
        // Fallback para dados em cache
        const info = localStorage.getItem("xtream_info");
        if (info) setUser(JSON.parse(info));
      })
      .finally(() => setLoading(false));
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("xtream_dns");
    localStorage.removeItem("xtream_user");
    localStorage.removeItem("xtream_pass");
    localStorage.removeItem("xtream_info");
    router.replace("/");
  }

  const isExpired = user?.exp_date
    ? Number(user.exp_date) < Date.now() / 1000
    : false;

  const expiry = user?.exp_date
    ? new Date(Number(user.exp_date) * 1000).toLocaleDateString("pt-BR")
    : "Sem expiração";

  const status = !user ? "checking" : isExpired ? "expired" : user.auth === 1 || user.auth === "1" ? "online" : "offline";

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-xl font-semibold text-white mb-8">Perfil</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{user?.username || "..."}</p>
            {loading ? (
              <p className="text-sm text-zinc-500">Verificando...</p>
            ) : status === "online" ? (
              <p className="text-sm text-green-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block"/>
                Conectado
              </p>
            ) : status === "expired" ? (
              <p className="text-sm text-red-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block"/>
                Plano expirado
              </p>
            ) : (
              <p className="text-sm text-red-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block"/>
                Desconectado
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 border-t border-zinc-800 pt-4">
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500">Servidor</span>
            <span className="text-sm text-white truncate max-w-48">{dns}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500">Usuário</span>
            <span className="text-sm text-white">{user?.username || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500">Expira em</span>
            <span className={`text-sm ${isExpired?"text-red-400":"text-white"}`}>{loading?"...":expiry}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500">Conexões</span>
            <span className="text-sm text-white">{loading?"...":`${user?.active_cons ?? "0"} / ${user?.max_connections ?? "1"}`}</span>
          </div>
          {user?.is_trial === "1" && (
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Tipo</span>
              <span className="text-sm text-yellow-400">Trial</span>
            </div>
          )}
        </div>
      </div>

      <button onClick={handleLogout}
        className="w-full bg-zinc-900 border border-zinc-800 hover:border-red-800 hover:text-red-400 text-zinc-400 text-sm font-medium py-3 rounded-xl transition-colors">
        Sair da conta
      </button>
    </div>
  );
}
