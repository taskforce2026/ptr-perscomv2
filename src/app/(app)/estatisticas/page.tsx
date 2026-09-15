import Link from "next/link";
import { exigirSessao } from "@/lib/auth";
import { estatisticasGerais } from "@/lib/estatisticas";
import { PageHeader, Panel } from "@/components/ui";
import { BarrasHorizontais, Donut, ColunasMensais, LinhaMensal, CartaoEstat } from "@/components/graficos";
import { Medalha } from "@/components/insignia";
import { COR_TIPO } from "@/lib/format";
import { FiltroPeriodo, AbasEstatisticas, lerPeriodo } from "./filtros";
import { servidorSeleccionado, servidoresArma } from "@/lib/servidor";
import { estadosServidores } from "@/lib/servidor-estado";
import { SelectorServidor } from "@/components/servidor-sel";

export const dynamic = "force-dynamic";

const COR_PRESENCA: Record<string, string> = {
  Presente: "#22c55e",
  Talvez: "#eab308",
  Ausente: "#ef4444",
  Justificado: "#3b82f6",
};
const COR_CAND: Record<string, string> = {
  Aceite: "#22c55e",
  Aprovada: "#22c55e",
  Rejeitada: "#ef4444",
  "Em Análise": "#3b82f6",
  Pendente: "#eab308",
};

export default async function EstatisticasPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  await exigirSessao();
  const periodo = lerPeriodo((await searchParams).periodo);
  const [srv, servidores, estados] = await Promise.all([
    servidorSeleccionado(),
    servidoresArma(),
    estadosServidores(),
  ]);
  const e = await estatisticasGerais(periodo, srv?.id);
  const t = e.totais;
  const onlineAgora = new Set(estados.flatMap((es) => es.operadores.map((o) => o.id))).size;

  return (
    <div>
      <PageHeader
        titulo="Estatísticas"
        subtitulo={`Análise do efectivo, actividade operacional e progressão dos operadores${srv ? ` · ${srv.nome}` : ""}.`}
      />
      <div className="mb-3">
        <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-gold-500">Servidor</div>
        <SelectorServidor servidores={servidores} actualId={srv?.id ?? null} />
      </div>
      <FiltroPeriodo actual={periodo} base="/estatisticas" />
      <AbasEstatisticas activa="geral" periodo={periodo} />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7">
        <CartaoEstat etiqueta="Efectivo" valor={t.militares} href="/pessoal" icone="👤" />
        <CartaoEstat etiqueta="Online agora" valor={onlineAgora} icone="📡" />
        <CartaoEstat etiqueta="Assiduidade" valor={`${t.assiduidade}%`} href="/estatisticas/operadores" icone="✓" />
        <CartaoEstat etiqueta="Eventos realizados" valor={t.eventos} href="/eventos" icone="📅" />
        <CartaoEstat etiqueta="Promoções" valor={t.promocoes} icone="★" />
        <CartaoEstat etiqueta="Condecorações" valor={t.condecoracoes} icone="🎖" />
        <CartaoEstat etiqueta="Qualificações" valor={t.qualificacoes} icone="◎" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel titulo="Presença nos servidores" className="lg:col-span-3">
          {estados.length === 0 ? (
            <p className="text-sm text-slate-500">Sem servidores Arma 3 com endereço para verificar.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {estados.map((es) => {
                const nomeServidor = servidores.find((s) => s.id === es.serverId)?.nome ?? `Servidor ${es.serverId}`;
                return (
                  <div key={es.serverId} className="rounded-xl border border-white/10 bg-black/30 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`h-2.5 w-2.5 rounded-full ${es.online ? "bg-emerald-400" : "bg-red-400"}`} />
                      <b className="text-gold-200">{nomeServidor}</b>
                      <span className="ml-auto text-[10px] text-slate-500">
                        {es.online ? "Ligado" : "Offline"}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {es.jogadores.length} jogador(es) · {es.operadores.length} operador(es) PTR
                    </div>
                    {es.operadores.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {es.operadores.map((o) => (
                          <span
                            key={o.id}
                            className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-200"
                          >
                            ● {o.nomeGuerra ?? o.nome}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-3 text-xs text-slate-500">
            O monitor liga a cada servidor (:2306) e cruza o <b>nome de guerra</b> dos jogadores com o efectivo.{" "}
            <b className="text-emerald-300">{onlineAgora} operador(es)</b> ligado(s) agora.
          </p>
        </Panel>

        <Panel titulo="Actividade mensal (eventos por tipo)" className="lg:col-span-2">
          <ColunasMensais
            rotulos={e.meses}
            series={e.eventosMensais
              .filter((s) => s.valores.some((v) => v > 0))
              .map((s) => ({ nome: s.tipo, valores: s.valores, cor: COR_TIPO[s.tipo] ?? "#d4b45a" }))}
          />
          <p className="mt-2 text-xs text-slate-500">
            Últimos 12 meses · {t.eventosFuturos} evento(s) agendado(s) a partir de hoje.
          </p>
        </Panel>
        <Panel titulo="Presenças">
          <Donut dados={e.presencasPorEstado.map((p) => ({ nome: p.estado, n: p.n, cor: COR_PRESENCA[p.estado] }))} />
          <p className="mt-3 text-xs text-slate-500">
            Taxa de assiduidade global: <b className="text-gold-300">{t.assiduidade}%</b> (presentes / total de marcações).
          </p>
        </Panel>

        <Panel titulo="Efectivo por estado">
          <Donut dados={e.porEstado.filter((s) => s.n > 0).map((s) => ({ nome: s.nome, n: s.n, cor: s.cor }))} />
        </Panel>
        <Panel titulo="Efectivo por unidade">
          <BarrasHorizontais dados={e.porUnidade.map((u) => ({ nome: u.nome, n: u.n }))} cor="#2f5f3a" />
        </Panel>
        <Panel titulo="Efectivo por patente">
          <BarrasHorizontais
            dados={e.porPatente.filter((p) => p.n > 0).map((p) => ({ nome: `${p.nome} — ${p.nomeCompleto}`, n: p.n }))}
            cor="#e0b84a"
            maxItens={24}
          />
        </Panel>

        <Panel titulo="Promoções por mês">
          <LinhaMensal rotulos={e.meses} valores={e.promocoesMensais} cor="#e0b84a" />
        </Panel>
        <Panel titulo="Condecorações por mês">
          <LinhaMensal rotulos={e.meses} valores={e.condecoracoesMensais} cor="#a855f7" />
        </Panel>
        <Panel titulo="Alistamentos por mês">
          <LinhaMensal rotulos={e.meses} valores={e.alistamentosMensais} cor="#22c55e" />
        </Panel>

        <Panel titulo="Condecorações mais atribuídas">
          {e.topCondecoracoes.filter((c) => c.n > 0).length === 0 ? (
            <p className="text-sm text-slate-500">Sem condecorações no período.</p>
          ) : (
            <ul className="space-y-2">
              {e.topCondecoracoes
                .filter((c) => c.n > 0)
                .map((c) => (
                  <li key={c.nome} className="flex items-center gap-3 text-sm">
                    <Medalha award={c} size={22} mostrarNome={false} />
                    <span className="flex-1 truncate">{c.nome}</span>
                    <span className="font-bold text-gold-300">{c.n}</span>
                  </li>
                ))}
            </ul>
          )}
        </Panel>
        <Panel titulo="Qualificações mais obtidas">
          <BarrasHorizontais
            dados={e.topQualificacoes.filter((q) => q.n > 0).map((q) => ({ nome: q.abrev ? `${q.abrev} — ${q.nome}` : q.nome, n: q.n }))}
            cor="#14b8a6"
          />
        </Panel>
        <Panel titulo="Especialidades">
          <BarrasHorizontais
            dados={e.porEspecialidade.filter((s) => s.n > 0).map((s) => ({ nome: s.nome, n: s.n }))}
            cor="#3b82f6"
          />
        </Panel>

        <Panel titulo="Eventos por tipo">
          <Donut dados={e.eventosPorTipo.map((x) => ({ nome: x.tipo, n: x.n, cor: COR_TIPO[x.tipo] ?? "#d4b45a" }))} />
        </Panel>
        <Panel titulo="Candidaturas">
          <Donut dados={e.candidaturasPorEstado.map((c) => ({ nome: c.status, n: c.n, cor: COR_CAND[c.status] }))} />
          <p className="mt-3 text-xs text-slate-500">
            {t.candidaturas} candidatura(s) no período · {t.contas} conta(s) activa(s) na app.
          </p>
        </Panel>
        <Panel
          titulo="Registo de actividade"
          accoes={
            <Link href="/actualizacoes" className="text-xs text-gold-300 hover:underline">
              Ver tudo →
            </Link>
          }
        >
          <div className="mb-1 text-xs uppercase tracking-wider text-slate-500">Por tipo de registo</div>
          <BarrasHorizontais dados={e.actividadePorEntidade.map((a) => ({ nome: a.entidade, n: a.n }))} cor="#94a3b8" maxItens={6} />
          <div className="mb-1 mt-4 text-xs uppercase tracking-wider text-slate-500">Quem mais regista</div>
          <BarrasHorizontais dados={e.actividadePorActor.map((a) => ({ nome: a.actor, n: a.n }))} cor="#e0b84a" maxItens={5} />
        </Panel>
      </div>
    </div>
  );
}
