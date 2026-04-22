"use client";
import { useEffect, useState } from "react";

interface HiddenCat { id: string; name: string; }

export default function SettingsPage() {
  const [quality, setQuality] = useState("auto");
  const [autoplay, setAutoplay] = useState(true);
  const [sortOrder, setSortOrder] = useState("default");
  const [parentalEnabled, setParentalEnabled] = useState(false);
  const [parentalPin, setParentalPin] = useState("0000");
  const [showPinInput, setShowPinInput] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);
  const [adultLocked, setAdultLocked] = useState(true);
  const [hiddenCats, setHiddenCats] = useState<HiddenCat[]>([]);
  const [showHideInput, setShowHideInput] = useState(false);
  const [catToHide, setCatToHide] = useState("");
  const [allCategories, setAllCategories] = useState<HiddenCat[]>([]);
  const [showCatPicker, setShowCatPicker] = useState(false);

  useEffect(() => {
    setQuality(localStorage.getItem("iptv_quality") || "auto");
    setAutoplay(localStorage.getItem("iptv_autoplay") !== "false");
    setSortOrder(localStorage.getItem("iptv_sort") || "default");
    setParentalEnabled(localStorage.getItem("iptv_parental") === "true");
    setParentalPin(localStorage.getItem("iptv_pin") || "0000");
    setAdultLocked(localStorage.getItem("iptv_adult_locked") !== "false");
    try { setHiddenCats(JSON.parse(localStorage.getItem("iptv_hidden_cats") || "[]")); } catch {}

    // Carregar categorias do servidor
    const dns = localStorage.getItem("xtream_dns");
    const user = localStorage.getItem("xtream_user");
    const pass = localStorage.getItem("xtream_pass");
    if (dns && user && pass) {
      Promise.all([
        fetch(`${dns}/player_api.php?username=${user}&password=${pass}&action=get_live_categories`).then(r=>r.json()).catch(()=>[]),
        fetch(`${dns}/player_api.php?username=${user}&password=${pass}&action=get_vod_categories`).then(r=>r.json()).catch(()=>[]),
        fetch(`${dns}/player_api.php?username=${user}&password=${pass}&action=get_series_categories`).then(r=>r.json()).catch(()=>[]),
      ]).then(([live, vod, ser]) => {
        const all = [...(live||[]), ...(vod||[]), ...(ser||[])].map((c:{category_id:string;category_name:string})=>({id:c.category_id,name:c.category_name}));
        setAllCategories(all);
      });
    }
  }, []);

  function saveParentalPin() {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) { setPinError("PIN deve ter 4 dígitos numéricos"); return; }
    if (newPin !== confirmPin) { setPinError("PINs não coincidem"); return; }
    localStorage.setItem("iptv_pin", newPin);
    setParentalPin(newPin);
    setNewPin(""); setConfirmPin(""); setPinError(""); setPinSuccess(true);
    setShowPinInput(false);
    setTimeout(()=>setPinSuccess(false), 3000);
  }

  function hideCategory(cat: HiddenCat) {
    const updated = [...hiddenCats.filter(c=>c.id!==cat.id), cat];
    setHiddenCats(updated);
    localStorage.setItem("iptv_hidden_cats", JSON.stringify(updated));
    setShowCatPicker(false);
  }

  function unhideCategory(id: string) {
    const updated = hiddenCats.filter(c=>c.id!==id);
    setHiddenCats(updated);
    localStorage.setItem("iptv_hidden_cats", JSON.stringify(updated));
  }

  const visibleCats = allCategories.filter(c=>!hiddenCats.find(h=>h.id===c.id));

  return (
    <div className="p-6 max-w-xl overflow-y-auto">
      <h1 className="text-xl font-semibold text-white mb-8">Configurações</h1>

      {/* Reprodução */}
      <section className="mb-8">
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Reprodução</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
          
          <div className="p-4">
            <p className="text-sm text-white font-medium mb-3">Qualidade padrão</p>
            <div className="grid grid-cols-3 gap-2">
              {["auto","HD","SD"].map(q=>(
                <button key={q} onClick={()=>{setQuality(q);localStorage.setItem("iptv_quality",q);}}
                  className={`py-2.5 rounded-xl text-xs font-medium border transition-all ${quality===q?"bg-violet-600 border-violet-600 text-white":"border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"}`}>
                  {q==="auto"?"Automático":q}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-white font-medium">Reprodução automática</p>
              <p className="text-xs text-zinc-500 mt-0.5">Próximo episódio automaticamente</p>
            </div>
            <button onClick={()=>{const v=!autoplay;setAutoplay(v);localStorage.setItem("iptv_autoplay",String(v));}}
              className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${autoplay?"bg-violet-600":"bg-zinc-700"}`}>
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${autoplay?"translate-x-6":"translate-x-0.5"}`}/>
            </button>
          </div>

          <div className="p-4">
            <p className="text-sm text-white font-medium mb-3">Ordenação do catálogo</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                {id:"default",label:"Padrão"},
                {id:"az",label:"A → Z"},
                {id:"za",label:"Z → A"},
                {id:"recent",label:"Mais recentes"},
              ].map(s=>(
                <button key={s.id} onClick={()=>{setSortOrder(s.id);localStorage.setItem("iptv_sort",s.id);}}
                  className={`py-2.5 rounded-xl text-xs font-medium border transition-all ${sortOrder===s.id?"bg-violet-600 border-violet-600 text-white":"border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Controle dos Pais */}
      <section className="mb-8">
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Controle dos pais</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">

          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-white font-medium">Ativar controle parental</p>
              <p className="text-xs text-zinc-500 mt-0.5">Proteger conteúdos com PIN</p>
            </div>
            <button onClick={()=>{const v=!parentalEnabled;setParentalEnabled(v);localStorage.setItem("iptv_parental",String(v));}}
              className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${parentalEnabled?"bg-violet-600":"bg-zinc-700"}`}>
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${parentalEnabled?"translate-x-6":"translate-x-0.5"}`}/>
            </button>
          </div>

          {parentalEnabled && (
            <>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-white font-medium">Bloquear conteúdo adulto</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Requer PIN para acessar categorias adultas</p>
                </div>
                <button onClick={()=>{const v=!adultLocked;setAdultLocked(v);localStorage.setItem("iptv_adult_locked",String(v));}}
                  className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${adultLocked?"bg-violet-600":"bg-zinc-700"}`}>
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${adultLocked?"translate-x-6":"translate-x-0.5"}`}/>
                </button>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-white font-medium">PIN de acesso</p>
                    <p className="text-xs text-zinc-500 mt-0.5">PIN atual: {"•".repeat(parentalPin.length)}</p>
                  </div>
                  <button onClick={()=>{setShowPinInput(p=>!p);setPinError("");}}
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                    {showPinInput?"Cancelar":"Alterar PIN"}
                  </button>
                </div>

                {showPinInput && (
                  <div className="space-y-2 mt-3">
                    <input type="password" maxLength={4} placeholder="Novo PIN (4 dígitos)" value={newPin}
                      onChange={e=>setNewPin(e.target.value.replace(/\D/g,"").slice(0,4))}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 tracking-widest"/>
                    <input type="password" maxLength={4} placeholder="Confirmar PIN" value={confirmPin}
                      onChange={e=>setConfirmPin(e.target.value.replace(/\D/g,"").slice(0,4))}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 tracking-widest"/>
                    {pinError&&<p className="text-xs text-red-400">{pinError}</p>}
                    <button onClick={saveParentalPin}
                      className="w-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
                      Salvar PIN
                    </button>
                  </div>
                )}
                {pinSuccess&&<p className="text-xs text-green-400 mt-2">PIN alterado com sucesso!</p>}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Ocultar categorias */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Categorias ocultas</h2>
          <button onClick={()=>setShowCatPicker(p=>!p)}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14"/></svg>
            Ocultar categoria
          </button>
        </div>

        {showCatPicker && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 mb-3 max-h-48 overflow-y-auto">
            <input type="text" placeholder="Buscar categoria..." value={catToHide}
              onChange={e=>setCatToHide(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-violet-500 mb-2"/>
            <div className="space-y-0.5">
              {visibleCats.filter(c=>c.name.toLowerCase().includes(catToHide.toLowerCase())).slice(0,30).map(cat=>(
                <button key={cat.id} onClick={()=>hideCategory(cat)}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors truncate">
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {hiddenCats.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
            <p className="text-xs text-zinc-600">Nenhuma categoria oculta</p>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
            {hiddenCats.map(cat=>(
              <div key={cat.id} className="flex items-center justify-between px-4 py-3">
                <p className="text-sm text-zinc-300 truncate flex-1">{cat.name}</p>
                <button onClick={()=>unhideCategory(cat.id)}
                  className="text-xs text-zinc-500 hover:text-red-400 transition-colors ml-3 flex-shrink-0">
                  Mostrar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sobre */}
      <section>
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Sobre</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm text-zinc-400">Versão</p>
            <p className="text-sm text-zinc-500">1.0.0</p>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm text-zinc-400">Player</p>
            <p className="text-sm text-zinc-500">HLS.js interno</p>
          </div>
          <button onClick={()=>{
            localStorage.removeItem("xtream_dns"); localStorage.removeItem("xtream_user");
            localStorage.removeItem("xtream_pass"); localStorage.removeItem("xtream_info");
            window.location.href="/";
          }} className="w-full px-4 py-3 text-sm text-red-400 hover:text-red-300 text-left transition-colors">
            Desconectar servidor
          </button>
        </div>
      </section>
    </div>
  );
}
