import type { ReactNode } from "react";
import Link from "next/link";
import { eComando, podeEditar, utilizadorActual } from "@/lib/auth";

export function PageHeader({
  titulo,
  subtitulo,
  accoes,
}: {
  titulo: string;
  subtitulo?: string;
  accoes?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-wide text-gold-300 md:text-3xl">
          {titulo}
        </h1>
        {subtitulo && <p className="mt-1 text-sm text-slate-400">{subtitulo}</p>}
      </div>
      {accoes && <div className="flex flex-wrap gap-2">{accoes}</div>}
    </div>
  );
}

export function Panel({
  titulo,
  accoes,
  className = "",
  children,
}: {
  titulo?: string;
  accoes?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`panel rounded-2xl p-4 md:p-5 ${className}`}>
      {(titulo || accoes) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {titulo && (
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-gold-400">{titulo}</h2>
          )}
          {accoes}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({
  etiqueta,
  valor,
  href,
  icone,
}: {
  etiqueta: string;
  valor: number | string;
  href?: string;
  icone?: string;
}) {
  const inner = (
    <div className="panel rounded-2xl p-4 hover:border-gold-400/50 transition">
      <div className="text-xs uppercase tracking-[0.16em] text-gold-500">
        {icone} {etiqueta}
      </div>
      <div className="mt-2 text-2xl font-black text-gold-200">{valor}</div>
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

export function StatusBadge({ nome, cor }: { nome: string; cor: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
      style={{ background: `${cor}22`, color: cor, border: `1px solid ${cor}55` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: cor }} />
      {nome}
    </span>
  );
}

export function Tag({
  children,
  tone = "gold",
}: {
  children: ReactNode;
  tone?: "gold" | "green" | "slate" | "red";
}) {
  const map = {
    gold: "bg-gold-500/15 text-gold-300 border-gold-500/30",
    green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    slate: "bg-white/5 text-slate-300 border-white/10",
    red: "bg-red-500/15 text-red-300 border-red-500/30",
  };
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${map[tone]}`}>
      {children}
    </span>
  );
}

export function Vazio({ texto }: { texto: string }) {
  return <p className="py-6 text-center text-sm text-slate-500">{texto}</p>;
}

export function Campo({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs uppercase tracking-wider text-gold-500">{label}</span>
      {children}
    </label>
  );
}

export async function SoEditores({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const u = await utilizadorActual();
  if (!u || !podeEditar(u)) return <>{fallback}</>;
  return <>{children}</>;
}

export async function SoComando({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const u = await utilizadorActual();
  if (!u || !eComando(u)) return <>{fallback}</>;
  return <>{children}</>;
}

export function EstadoCandidatura({ status }: { status: string }) {
  const tone = status === "Aprovada" ? "green" : status === "Rejeitada" ? "red" : "gold";
  return <Tag tone={tone}>{status}</Tag>;
}
