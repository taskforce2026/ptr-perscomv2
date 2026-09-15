"use client";

import { seleccionarServidor } from "@/lib/actions";

export function SelectorServidor({
  servidores,
  actualId,
  compacto = false,
}: {
  servidores: { id: number; nome: string; tipo: string }[];
  actualId: number | null;
  compacto?: boolean;
}) {
  if (servidores.length === 0) return null;
  return (
    <form action={seleccionarServidor} className={compacto ? "flex items-center gap-1" : "flex flex-wrap gap-2"}>
      <input type="hidden" name="next" value="/estatisticas" />
      {servidores.map((s) => (
        <button
          key={s.id}
          name="id"
          value={s.id}
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            actualId === s.id
              ? "border-gold-400 bg-gold-500/20 text-gold-200"
              : "border-white/10 text-slate-400 hover:text-gold-200"
          }`}
        >
          {compacto ? s.nome : `${s.tipo} · ${s.nome}`}
        </button>
      ))}
    </form>
  );
}
