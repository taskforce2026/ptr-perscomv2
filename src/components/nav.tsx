"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SinoNotificacoes, type Notif } from "@/components/sino";

type SessaoNav = {
  pendentes: number;
  nome: string;
  patente: string | null;
  insignia: string | null;
  role: string;
  podeEditar: boolean;
  eComando: boolean;
  eOficial: boolean;
  abas: string[];
};

const MENU = [
  { href: "/", label: "Painel", icon: "◇", tab: true },
  { href: "/pessoal", label: "Pessoal", icon: "👤", tab: true },
  { href: "/rosters", label: "Rosters", icon: "☰", tab: true },
  { href: "/eventos", label: "Eventos", icon: "📅", tab: true },
  { href: "/holograma", label: "Holograma", icon: "◈", extra: true },
  { href: "/fotos", label: "Fotos", icon: "🖼", extra: true },
  { href: "/chat/operadores", label: "Chat Operadores", icon: "💬", extra: true },
  { href: "/chat/comando", label: "Chat Comando", icon: "★", extra: true, comando: true },
  { href: "/estatisticas", label: "Estatísticas", icon: "📊" },
  { href: "/servidor", label: "Servidor", icon: "🖥" },
  { href: "/actualizacoes", label: "Actualizações", icon: "⇄" },
  { href: "/avisos", label: "Avisos", icon: "🔔" },
  { href: "/candidaturas", label: "Candidaturas", icon: "📥", editor: true },
  { href: "/documentos", label: "Documentos", icon: "📄" },
  { href: "/formularios", label: "Formulários", icon: "📝", editor: true },
  { href: "/admin/patentes", label: "Patentes", icon: "⭐", editor: true },
  { href: "/admin/cargos", label: "Cargos", icon: "⚑", editor: true },
  { href: "/admin/especialidades", label: "Especialidades", icon: "✚", editor: true },
  { href: "/admin/estados", label: "Estados", icon: "●", editor: true },
  { href: "/admin/unidades", label: "Unidades", icon: "⌂", editor: true },
  { href: "/admin/rosters", label: "Listas de Roster", icon: "☰", editor: true },
  { href: "/admin/condecoracoes", label: "Condecorações", icon: "🏅", editor: true },
  { href: "/admin/qualificacoes", label: "Qualificações", icon: "◎", editor: true },
  { href: "/admin/acessos", label: "Acessos e permissões", icon: "🔐", comando: true },
  { href: "/instalar", label: "Instalar App", icon: "↓" },
];

function visivel(item: (typeof MENU)[number], sessao: SessaoNav) {
  if (sessao.eComando) return true;
  if (item.comando && !sessao.eOficial && !sessao.eComando) return false;
  if (item.href === "/chat/comando" && !sessao.eOficial) return false;
  if (item.editor && !sessao.podeEditar && !sessao.eComando) return false;
  if (item.href === "/admin/acessos" && !sessao.eComando) return false;
  if (item.href !== "/" && !sessao.abas.includes(item.href)) return false;
  return true;
}

export function Sidebar({ sessao, notificacoes = [] }: { sessao: SessaoNav; notificacoes?: Notif[] }) {
  const path = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col overflow-y-auto border-r border-gold-500/15 bg-forest-900/90 p-4 lg:flex">
      <Link href="/" className="mb-6 flex items-center gap-3 px-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/emblema.png" alt="PTR" className="h-12 w-12 rounded-full ring-2 ring-gold-500/40" />
        <div>
          <div className="font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.2em] text-gold-300">
            PTR PERSCOM
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Phoenix Rangers</div>
        </div>
      </Link>
      <div className="mb-4 flex items-start gap-2">
        <Link href="/conta" className="panel flex flex-1 items-center gap-3 rounded-xl p-3">
        {sessao.insignia ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sessao.insignia} alt="" className="h-8 w-8 object-contain" />
        ) : (
          <span className="grid h-8 w-8 place-items-center rounded bg-gold-500/10 text-gold-400">★</span>
        )}
        <div className="min-w-0">
          <div className="truncate font-bold text-gold-200">{sessao.nome}</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500">{sessao.patente ?? sessao.role}</div>
        </div>
        </Link>
        <SinoNotificacoes iniciais={notificacoes} />
      </div>
      <nav className="grid gap-1 pb-8">
        {MENU.filter((i) => visivel(i, sessao)).map((item) => {
          const activo = item.href === "/" ? path === "/" : path.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                activo ? "bg-gold-500/15 text-gold-200" : "text-slate-300 hover:bg-white/5 hover:text-gold-200"
              } ${item.extra ? "border border-gold-500/20" : ""}`}
            >
              <span className="w-5 text-center">{item.icon}</span>
              {item.label}
              {item.href === "/admin/acessos" && sessao.pendentes > 0 && (
                <span className="ml-auto rounded-full bg-amber-500 px-1.5 text-[10px] font-black text-black">
                  {sessao.pendentes}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileHeader({ sessao, notificacoes = [] }: { sessao: SessaoNav; notificacoes?: Notif[] }) {
  const [aberto, setAberto] = useState(false);
  const path = usePathname();
  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gold-500/20 bg-forest-950/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/emblema.png" alt="PTR" className="h-9 w-9 rounded-full ring-1 ring-gold-500/40" />
          <span className="font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.18em] text-gold-300">
            PTR PERSCOM
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <SinoNotificacoes iniciais={notificacoes} />
          <button onClick={() => setAberto(true)} className="text-2xl text-gold-300" aria-label="Menu">
            ☰
          </button>
        </div>
      </header>
      {aberto && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#050805] lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/emblema.png" alt="PTR" className="h-9 w-9 rounded-full" />
              <span className="font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.18em] text-gold-300">
                PTR PERSCOM
              </span>
            </div>
            <button onClick={() => setAberto(false)} className="grid h-10 w-10 place-items-center text-2xl text-gold-300">
              ×
            </button>
          </div>
          <Link href="/conta" onClick={() => setAberto(false)} className="mx-4 mb-4 flex items-center gap-3 rounded-2xl border border-gold-500/25 bg-forest-900 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-gold-500/20 text-gold-400">
              {sessao.insignia ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sessao.insignia} alt="" className="h-7 w-7" />
              ) : (
                "_"
              )}
            </span>
            <div>
              <div className="font-bold text-gold-200">{sessao.nome}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{sessao.role}</div>
            </div>
          </Link>
          <div className="grid grid-cols-2 gap-2 px-4 pb-28">
            {MENU.filter((i) => visivel(i, sessao)).map((item) => {
              const activo = item.href === "/" ? path === "/" : path.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setAberto(false)}
                  className={`flex items-center gap-2 rounded-2xl border px-3 py-3.5 text-sm ${
                    activo ? "border-gold-400 bg-gold-500/10 text-gold-200" : "border-gold-500/20 bg-forest-900 text-slate-200"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="leading-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

export function MobileTabBar({ abas }: { abas?: string[] }) {
  const path = usePathname();
  const tabs = [
    { href: "/", label: "Painel", icon: "N" },
    { href: "/pessoal", label: "Pessoal", icon: "👤" },
    { href: "/holograma", label: "Holo", icon: "◈" },
    { href: "/fotos", label: "Fotos", icon: "🖼" },
    { href: "/chat/operadores", label: "Chat", icon: "💬" },
  ].filter((t) => t.href === "/" || !abas || abas.includes(t.href));
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-gold-500/20 bg-forest-950/95 px-1 py-2 backdrop-blur print:hidden lg:hidden">
      {tabs.map((t) => {
        const activo = t.href === "/" ? path === "/" : path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex flex-col items-center gap-0.5 text-[11px] ${activo ? "text-gold-300" : "text-slate-400"}`}
          >
            <span className="text-base">{t.icon}</span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
