"use client";
import { useState } from "react";

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
}

export default function PinPrompt({ onSuccess, onCancel, title="Conteúdo protegido" }: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  function check() {
    const stored = localStorage.getItem("iptv_pin") || "0000";
    if (pin === stored) { onSuccess(); }
    else { setError("PIN incorreto"); setPin(""); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-80">
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          </div>
          <h3 className="text-white font-semibold text-sm">{title}</h3>
          <p className="text-zinc-500 text-xs mt-1">Digite o PIN de controle parental</p>
        </div>

        <div className="flex justify-center gap-3 mb-4">
          {[0,1,2,3].map(i=>(
            <div key={i} className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg font-bold transition-colors ${pin.length>i?"border-violet-500 bg-violet-600/20 text-white":"border-zinc-700 bg-zinc-800 text-zinc-700"}`}>
              {pin.length>i?"•":""}
            </div>
          ))}
        </div>

        {error && <p className="text-xs text-red-400 text-center mb-3">{error}</p>}

        <div className="grid grid-cols-3 gap-2 mb-3">
          {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k,i)=>(
            <button key={i} onClick={()=>{
              if(k==="⌫") { setPin(p=>p.slice(0,-1)); setError(""); }
              else if(k!=="" && pin.length<4) { const np=pin+String(k); setPin(np); setError(""); if(np.length===4) setTimeout(()=>{ const s=localStorage.getItem("iptv_pin")||"0000"; if(np===s) onSuccess(); else{setError("PIN incorreto");setPin("");} },100); }
            }}
            className={`py-3 rounded-xl text-sm font-medium transition-colors ${k===""?"pointer-events-none":"bg-zinc-800 hover:bg-zinc-700 text-white active:scale-95"}`}>
              {k}
            </button>
          ))}
        </div>

        <button onClick={onCancel} className="w-full text-xs text-zinc-600 hover:text-zinc-400 transition-colors py-2">Cancelar</button>
      </div>
    </div>
  );
}
