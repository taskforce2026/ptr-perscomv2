"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { marcarNotificacoesLidas } from "@/lib/actions";

export type Notif = {
  id: number;
  titulo: string;
  corpo: string | null;
  href: string | null;
  lida: boolean;
  criadoEm: string;
};

export function SinoNotificacoes({ iniciais }: { iniciais: Notif[] }) {
  const [aberto, setAberto] = useState(false);
  const [lista, setLista] = useState(iniciais);
  const [pending, start] = useTransition();
  const router = useRouter();
  const naoLidas = lista.filter((n) => !n.lida).length;

  function abrir() {
    setAberto((v) => !v);
    if (!aberto && naoLidas > 0) {
      start(async () => {
        await marcarNotificacoesLidas();
        setLista((prev) => prev.map((n) => ({ ...n, lida: true })));
        router.refresh();
      });
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={abrir}
        className="relative grid h-10 w-10 place-items-center rounded-full border border-gold-500/30 text-lg text-gold-300 hover:bg-gold-500/10"
        aria-label="Notificações"
      >
        🔔
        {naoLidas > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>
      {aberto && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-gold-500/25 bg-forest-900 shadow-2xl">
          <div className="border-b border-gold-500/15 px-3 py-2 text-xs font-bold uppercase tracking-widest text-gold-400">
            Notificações {pending ? "· a marcar lidas…" : ""}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {lista.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-slate-500">Sem notificações.</li>
            ) : (
              lista.map((n) => (
                <li key={n.id} className={`border-b border-white/5 px-3 py-2 ${n.lida ? "" : "bg-gold-500/5"}`}>
                  {n.href ? (
                    <Link href={n.href} onClick={() => setAberto(false)} className="block">
                      <div className="text-sm font-semibold text-gold-200">{n.titulo}</div>
                      {n.corpo && <div className="text-xs text-slate-400">{n.corpo}</div>}
                    </Link>
                  ) : (
                    <>
                      <div className="text-sm font-semibold text-gold-200">{n.titulo}</div>
                      {n.corpo && <div className="text-xs text-slate-400">{n.corpo}</div>}
                    </>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
