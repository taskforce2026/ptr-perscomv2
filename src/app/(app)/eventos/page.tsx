import Link from "next/link";
import { db } from "@/db";
import { events } from "@/db/schema";
import { and, gte, lt, asc, desc } from "drizzle-orm";
import { PageHeader, Panel, Vazio, SoEditores } from "@/components/ui";
import { NOMES_MESES, fmtDataHora, grelhaMes, isoLocal, corTipo, iconeTipo } from "@/lib/format";
import { exigirSessao } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EventosPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  await exigirSessao();
  const { mes } = await searchParams;
  const hoje = new Date();
  const hojeIso = isoLocal(hoje);
  const m = mes?.match(/^(\d{4})-(\d{2})$/);
  const ano = m ? Number(m[1]) : hoje.getFullYear();
  const mes1 = m ? Number(m[2]) : hoje.getMonth() + 1;
  const inicioMes = new Date(ano, mes1 - 1, 1);
  const fimMes = new Date(ano, mes1, 1);
  const anterior = new Date(ano, mes1 - 2, 1);
  const seguinte = new Date(ano, mes1, 1);
  const fmtMes = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  const [doMes, proximos, passados] = await Promise.all([
    db.query.events.findMany({
      where: and(gte(events.dataInicio, inicioMes), lt(events.dataInicio, fimMes)),
      orderBy: [asc(events.dataInicio)],
      with: { unit: true },
    }),
    db.query.events.findMany({
      where: gte(events.dataInicio, hoje),
      orderBy: [asc(events.dataInicio)],
      limit: 8,
      with: { unit: true, attendance: true },
    }),
    db.query.events.findMany({
      where: lt(events.dataInicio, hoje),
      orderBy: [desc(events.dataInicio)],
      limit: 5,
      with: { attendance: true },
    }),
  ]);

  const porDia = new Map<string, typeof doMes>();
  for (const e of doMes) {
    const k = isoLocal(e.dataInicio);
    porDia.set(k, [...(porDia.get(k) ?? []), e]);
  }
  const grelha = grelhaMes(ano, mes1);

  return (
    <div>
      <PageHeader
        titulo="Eventos"
        subtitulo="Calendário de treinos, missões e operações da PTR."
        accoes={
          <SoEditores>
            <Link href="/eventos/novo" className="btn btn-primary">
              + Novo evento
            </Link>
          </SoEditores>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="!p-0 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gold-500/15 px-4 py-3">
            <Link href={`/eventos?mes=${fmtMes(anterior)}`} className="btn btn-ghost !px-2">
              ‹
            </Link>
            <div className="text-lg font-bold text-gold-300">
              {NOMES_MESES[mes1 - 1]} {ano}
            </div>
            <div className="flex gap-1">
              <Link href="/eventos" className="btn btn-ghost !px-2 text-xs">
                Hoje
              </Link>
              <Link href={`/eventos?mes=${fmtMes(seguinte)}`} className="btn btn-ghost !px-2">
                ›
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-7 text-[10px] font-semibold uppercase tracking-wider text-gold-500">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
              <div key={d} className="px-2 py-1.5 text-center">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {grelha.map((d, i) => {
              const evs = porDia.get(d.iso) ?? [];
              const eHoje = d.iso === hojeIso;
              return (
                <div
                  key={i}
                  className={`min-h-[72px] border-b border-r border-white/5 p-1 lg:min-h-[96px] ${d.doMes ? "" : "opacity-30"} ${eHoje ? "bg-gold-500/10" : ""}`}
                >
                  <div className={`mb-1 text-xs ${eHoje ? "font-bold text-gold-300" : "text-slate-400"}`}>{d.dia}</div>
                  <div className="space-y-0.5">
                    {evs.map((e) => (
                      <Link
                        key={e.id}
                        href={`/eventos/${e.id}`}
                        className="block truncate rounded px-1 text-[10px]"
                        style={{ background: `${corTipo(e.tipo)}22`, color: corTipo(e.tipo) }}
                      >
                        {e.titulo}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
        <div className="space-y-4">
          <Panel titulo="Próximos">
            {proximos.length === 0 ? (
              <Vazio texto="Nada agendado." />
            ) : (
              <ul className="space-y-2">
                {proximos.map((e) => (
                  <li key={e.id}>
                    <Link href={`/eventos/${e.id}`} className="block rounded-lg border border-white/5 p-2 hover:border-gold-500/30">
                      <div className="text-xs" style={{ color: corTipo(e.tipo) }}>
                        {iconeTipo(e.tipo)} {e.tipo}
                      </div>
                      <div className="font-semibold">{e.titulo}</div>
                      <div className="text-xs text-slate-400">{fmtDataHora(e.dataInicio)}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel titulo="Últimos">
            {passados.map((e) => (
              <Link key={e.id} href={`/eventos/${e.id}`} className="mb-2 block text-sm text-slate-300 hover:text-gold-300">
                {e.titulo} · {fmtDataHora(e.dataInicio)}
              </Link>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );
}
