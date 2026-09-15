"use client";

import { useMemo, useState } from "react";

export type HoloOp = {
  id: number;
  nome: string;
  nomeGuerra: string | null;
  foto: string | null;
  numeroServico: string | null;
  bio: string | null;
  rank: { nome: string; abreviatura: string; imagem: string | null; categoria: string } | null;
  unit: { nome: string; abreviatura: string | null } | null;
  position: { nome: string } | null;
  specialty: { abreviatura: string } | null;
  status: { nome: string; cor: string } | null;
};

export function HologramaScene({ operadores }: { operadores: HoloOp[] }) {
  const [sel, setSel] = useState<HoloOp | null>(operadores[0] ?? null);
  const [paused, setPaused] = useState(false);
  const activos = operadores.filter((o) => o.status?.nome === "Activo").length;

  const ring = useMemo(() => {
    const n = Math.max(operadores.length, 1);
    return operadores.map((op, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      return { op, angle };
    });
  }, [operadores]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/holograma-hud.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
      <div className="scanlines absolute inset-0" />
      <div className="relative grid gap-4 p-4 lg:grid-cols-[1.4fr_0.8fr] lg:p-6">
        <div className="min-h-[460px]">
          <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.25em] text-cyan-300">
            <span>Projecto holográfico · {operadores.length} operadores</span>
            <button className="btn btn-ghost !py-1 !text-[11px]" onClick={() => setPaused((p) => !p)}>
              {paused ? "Rodar" : "Pausar"}
            </button>
          </div>
          <div className="relative mx-auto h-[420px] w-full max-w-[560px] perspective-[1200px]">
            <div className="pulse-ring absolute left-1/2 top-[58%] h-40 w-[78%] -translate-x-1/2 rounded-[100%] border border-cyan-300/40 bg-cyan-400/5 blur-[1px]" />
            <div className="absolute left-1/2 top-[58%] h-28 w-[62%] -translate-x-1/2 rounded-[100%] border border-gold-400/30" />
            <div
              className="absolute inset-0"
              style={{
                transformStyle: "preserve-3d",
                animation: paused ? "none" : "spin-slow 28s linear infinite",
              }}
            >
              {ring.map(({ op, angle }) => {
                const activo = sel?.id === op.id;
                return (
                  <button
                    key={op.id}
                    onClick={() => {
                      setSel(op);
                      setPaused(true);
                    }}
                    className="absolute left-1/2 top-1/2 origin-center"
                    style={{
                      transform: `rotateY(${(angle * 180) / Math.PI}deg) translateZ(190px) translateY(-18px)`,
                    }}
                  >
                    <span
                      className={`block w-24 overflow-hidden rounded-xl border ${
                        activo ? "border-gold-300 holo-glow" : "border-cyan-400/30"
                      } bg-black/50`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={op.foto || "/emblema.png"} alt="" className="h-24 w-24 object-cover opacity-90" />
                      <span className="block truncate px-1 py-1 text-[10px] text-cyan-100">
                        {op.rank?.abreviatura} {op.nomeGuerra ?? op.nome.split(" ")[0]}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="absolute left-1/2 top-[46%] -translate-x-1/2 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/emblema.png" alt="" className="mx-auto h-20 w-20 rounded-full opacity-80 ring-2 ring-gold-400/40" />
              <div className="mt-2 font-[family-name:var(--font-display)] text-xs tracking-[0.3em] text-gold-300">PTR</div>
            </div>
          </div>
        </div>

        <div className="panel holo-glow rounded-2xl bg-black/50 p-4">
          {sel ? (
            <>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sel.foto || "/emblema.png"} alt="" className="h-20 w-20 rounded-xl object-cover" />
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-cyan-300">{sel.numeroServico}</div>
                  <div className="font-[family-name:var(--font-display)] text-xl text-gold-200">
                    {sel.rank?.abreviatura} {sel.nomeGuerra ?? sel.nome}
                  </div>
                  <div className="text-sm text-slate-300">{sel.nome}</div>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <Info k="Patente" v={sel.rank?.nome} />
                <Info k="Unidade" v={sel.unit?.nome} />
                <Info k="Cargo" v={sel.position?.nome} />
                <Info k="Especialidade" v={sel.specialty?.abreviatura} />
                <Info k="Estado" v={sel.status?.nome} />
                <Info k="Categoria" v={sel.rank?.categoria} />
              </dl>
              {sel.bio && <p className="mt-3 text-sm leading-relaxed text-slate-300">{sel.bio}</p>}
              <a href={`/pessoal/${sel.id}`} className="btn btn-primary mt-4 w-full">
                Abrir perfil
              </a>
            </>
          ) : (
            <p className="text-slate-500">Sem operadores no holograma.</p>
          )}
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <Mini n={operadores.length} l="Efectivo" />
            <Mini n={activos} l="Activos" />
            <Mini n={operadores.filter((o) => o.rank?.categoria === "oficial" || o.rank?.categoria === "general").length} l="Oficiais" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ k, v }: { k: string; v?: string | null }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/5 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-cyan-500">{k}</div>
      <div className="text-gold-100">{v ?? "—"}</div>
    </div>
  );
}

function Mini({ n, l }: { n: number; l: string }) {
  return (
    <div className="rounded-lg border border-cyan-400/20 py-2">
      <div className="text-lg font-black text-cyan-200">{n}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{l}</div>
    </div>
  );
}
