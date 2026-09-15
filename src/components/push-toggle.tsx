"use client";

import { useState } from "react";

function base64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function PushToggle() {
  const [estado, setEstado] = useState<"idle" | "activo" | "sem" | "erro">("idle");
  const [busy, setBusy] = useState(false);

  async function ativar() {
    setBusy(true);
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setEstado("sem");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      const r = await fetch("/api/push/vapid");
      const { chave } = (await r.json()) as { chave: string };
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(chave),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      setEstado(res.ok ? "activo" : "erro");
    } catch {
      setEstado("erro");
    } finally {
      setBusy(false);
    }
  }

  if (estado === "activo") {
    return <span className="text-[11px] font-bold text-emerald-300">🔔 Push activado</span>;
  }
  if (estado === "sem") {
    return <span className="text-[11px] text-slate-500">Este browser não suporta push.</span>;
  }
  return (
    <button
      type="button"
      onClick={() => void ativar()}
      disabled={busy}
      className="rounded-full border border-gold-500/30 px-3 py-1 text-[11px] font-semibold text-gold-300 transition hover:bg-gold-500/10"
    >
      {busy ? "A activar…" : estado === "erro" ? "Tentar de novo 🔔" : "🔔 Activar notificações push"}
    </button>
  );
}
