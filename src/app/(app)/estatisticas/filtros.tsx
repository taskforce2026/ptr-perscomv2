import Link from "next/link";
import type { Periodo } from "@/lib/estatisticas";

const PERIODOS: { k: Periodo; l: string }[] = [
  { k: "30d", l: "30 dias" },
  { k: "90d", l: "90 dias" },
  { k: "180d", l: "6 meses" },
  { k: "365d", l: "1 ano" },
  { k: "tudo", l: "Tudo" },
];

export function FiltroPeriodo({ actual, base, extra = "" }: { actual: Periodo; base: string; extra?: string }) {
  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {PERIODOS.map((p) => (
        <Link
          key={p.k}
          href={`${base}?periodo=${p.k}${extra}`}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            actual === p.k
              ? "border-gold-500/50 bg-gold-500/20 text-gold-300"
              : "border-white/10 text-slate-400 hover:text-slate-200"
          }`}
        >
          {p.l}
        </Link>
      ))}
    </div>
  );
}

export function AbasEstatisticas({ activa, periodo }: { activa: "geral" | "operadores"; periodo: Periodo }) {
  const abas = [
    { k: "geral" as const, l: "Visão geral", href: `/estatisticas?periodo=${periodo}` },
    { k: "operadores" as const, l: "Operadores", href: `/estatisticas/operadores?periodo=${periodo}` },
  ];
  return (
    <div className="mb-4 flex gap-1 border-b border-gold-500/15">
      {abas.map((a) => (
        <Link
          key={a.k}
          href={a.href}
          className={`rounded-t-lg border-b-2 px-4 py-2 text-sm transition ${
            activa === a.k ? "border-gold-400 bg-gold-500/5 text-gold-300" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          {a.l}
        </Link>
      ))}
    </div>
  );
}

export function lerPeriodo(v: string | undefined): Periodo {
  return (["30d", "90d", "180d", "365d", "tudo"] as Periodo[]).includes(v as Periodo) ? (v as Periodo) : "180d";
}
