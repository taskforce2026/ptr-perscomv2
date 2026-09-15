import Link from "next/link";
import { exigirSessao } from "@/lib/auth";
import { estatisticasOperadores, type LinhaOperador } from "@/lib/estatisticas";
import { PageHeader, Panel, StatusBadge, Vazio } from "@/components/ui";
import { Insignia } from "@/components/insignia";
import { Progresso } from "@/components/graficos";
import { fmtData, nomeCompleto } from "@/lib/format";
import { FiltroPeriodo, AbasEstatisticas, lerPeriodo } from "../filtros";
import { db } from "@/db";
import { servidorSeleccionado, servidoresArma } from "@/lib/servidor";
import { SelectorServidor } from "@/components/servidor-sel";

export const dynamic = "force-dynamic";

type Ordem =
  | keyof Pick<
      LinhaOperador,
      | "pontuacao"
      | "assiduidade"
      | "presencas"
      | "faltas"
      | "promocoes"
      | "condecoracoes"
      | "qualificacoes"
      | "operacoes"
      | "diasServico"
    >
  | "nome"
  | "patente";

const COLUNAS: { k: Ordem; l: string; titulo: string }[] = [
  { k: "patente", l: "Patente", titulo: "Ordenar por patente" },
  { k: "nome", l: "Militar", titulo: "Ordenar por nome" },
  { k: "assiduidade", l: "Assiduidade", titulo: "Presenças / eventos elegíveis" },
  { k: "presencas", l: "Pres.", titulo: "Presenças" },
  { k: "faltas", l: "Faltas", titulo: "Ausências" },
  { k: "operacoes", l: "Ops", titulo: "Registos de combate" },
  { k: "promocoes", l: "Prom.", titulo: "Promoções" },
  { k: "condecoracoes", l: "Cond.", titulo: "Condecorações" },
  { k: "qualificacoes", l: "Qual.", titulo: "Qualificações" },
  { k: "diasServico", l: "Serviço", titulo: "Dias de serviço" },
  { k: "pontuacao", l: "Pontos", titulo: "Pontuação de progresso" },
];

export default async function OperadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; ordem?: string; dir?: string; unidade?: string }>;
}) {
  await exigirSessao();
  const sp = await searchParams;
  const periodo = lerPeriodo(sp.periodo);
  const ordem: Ordem = (COLUNAS.find((c) => c.k === sp.ordem)?.k ?? "pontuacao") as Ordem;
  const dir = sp.dir === "asc" ? "asc" : "desc";
  const [srv, servidores] = await Promise.all([servidorSeleccionado(), servidoresArma()]);
  const [linhasTodas, unidades] = await Promise.all([
    estatisticasOperadores(periodo, srv?.id),
    db.query.units.findMany({ orderBy: (u, { asc }) => asc(u.ordem) }),
  ]);
  const unidadeSel = sp.unidade ? unidades.find((u) => String(u.id) === sp.unidade) : undefined;
  const linhas = unidadeSel ? linhasTodas.filter((l) => l.unidade === unidadeSel.nome) : [...linhasTodas];

  linhas.sort((a, b) => {
    let r = 0;
    if (ordem === "nome") r = a.nome.localeCompare(b.nome);
    else if (ordem === "patente") r = (a.rank?.ordem ?? 0) - (b.rank?.ordem ?? 0);
    else r = (a[ordem] as number) - (b[ordem] as number);
    return dir === "asc" ? r : -r;
  });

  const extra = `${unidadeSel ? `&unidade=${unidadeSel.id}` : ""}`;
  const hrefOrdem = (k: Ordem) =>
    `/estatisticas/operadores?periodo=${periodo}&ordem=${k}&dir=${ordem === k && dir === "desc" ? "asc" : "desc"}${extra}`;
  const media = (f: (l: LinhaOperador) => number) =>
    linhas.length ? Math.round(linhas.reduce((a, l) => a + f(l), 0) / linhas.length) : 0;
  const top = [...linhas].sort((a, b) => b.pontuacao - a.pontuacao).slice(0, 3);
  const emRisco = linhas.filter((l) => l.eventosElegiveis >= 3 && l.assiduidade < 50);

  return (
    <div>
      <PageHeader
        titulo="Estatísticas · Operadores"
        subtitulo={`Progressão individual${srv ? ` · ${srv.nome}` : ""}.`}
      />
      <div className="mb-3">
        <SelectorServidor servidores={servidores} actualId={srv?.id ?? null} />
      </div>
      <FiltroPeriodo actual={periodo} base="/estatisticas/operadores" extra={extra} />
      <AbasEstatisticas activa="operadores" periodo={periodo} />

      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <Panel titulo="🏆 Top progresso">
          <ol className="space-y-2">
            {top.map((l, i) => (
              <li key={l.id} className="flex items-center gap-2 text-sm">
                <span className="w-6 text-lg">{["🥇", "🥈", "🥉"][i]}</span>
                <Insignia rank={l.rank} size={22} />
                <Link href={`/pessoal/${l.id}`} className="flex-1 truncate hover:text-gold-300">
                  {nomeCompleto(l)}
                </Link>
                <span className="font-bold text-gold-300">{l.pontuacao} pts</span>
              </li>
            ))}
            {top.length === 0 && <li className="text-sm text-slate-500">Sem dados.</li>}
          </ol>
        </Panel>
        <Panel titulo="Médias do efectivo">
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-400">Assiduidade média</dt>
              <dd className="font-bold text-gold-300">{media((l) => l.assiduidade)}%</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Presenças por operador</dt>
              <dd className="font-bold">{media((l) => l.presencas)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Operações por operador</dt>
              <dd className="font-bold">{media((l) => l.operacoes)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Qualificações por operador</dt>
              <dd className="font-bold">{media((l) => l.qualificacoes)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Dias de serviço (média)</dt>
              <dd className="font-bold">{media((l) => l.diasServico)}</dd>
            </div>
          </dl>
        </Panel>
        <Panel titulo={`⚠ Assiduidade baixa (${emRisco.length})`}>
          {emRisco.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum operador com assiduidade abaixo de 50%.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {emRisco.slice(0, 6).map((l) => (
                <li key={l.id} className="flex items-center gap-2">
                  <Insignia rank={l.rank} size={18} />
                  <Link href={`/pessoal/${l.id}`} className="flex-1 truncate hover:text-gold-300">
                    {nomeCompleto(l)}
                  </Link>
                  <span className="text-xs font-semibold text-red-300">{l.assiduidade}%</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        className="!p-0"
        titulo={`${linhas.length} operador(es)`}
        accoes={
          <form method="get" className="flex items-center gap-2">
            <input type="hidden" name="periodo" value={periodo} />
            <input type="hidden" name="ordem" value={ordem} />
            <input type="hidden" name="dir" value={dir} />
            <select name="unidade" defaultValue={unidadeSel?.id ?? ""} className="input !w-auto !py-1 text-xs">
              <option value="">Todas as unidades</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
            <button className="btn btn-secondary !py-1 text-xs">Filtrar</button>
          </form>
        }
      >
        {linhas.length === 0 ? (
          <div className="p-5">
            <Vazio texto="Sem operadores." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  {COLUNAS.map((c) => (
                    <th key={c.k} title={c.titulo} className={["nome", "patente", "assiduidade"].includes(c.k) ? "" : "text-center"}>
                      <Link href={hrefOrdem(c.k)} className={`hover:text-gold-300 ${ordem === c.k ? "text-gold-300" : ""}`}>
                        {c.l}
                        {ordem === c.k && (dir === "desc" ? " ▼" : " ▲")}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <Insignia rank={l.rank} size={22} mostrarSigla />
                    </td>
                    <td>
                      <Link href={`/pessoal/${l.id}`} className="block max-w-[200px] truncate font-medium hover:text-gold-300">
                        {nomeCompleto(l)}
                      </Link>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        {l.unidade ?? "—"}
                        {l.estado && <StatusBadge nome={l.estado.nome} cor={l.estado.cor} />}
                      </div>
                    </td>
                    <td>
                      <Progresso valor={l.assiduidade} />
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        {l.presencas}/{Math.max(l.eventosElegiveis, l.presencas + l.faltas + l.justificados + l.talvez)} eventos
                      </div>
                    </td>
                    <td className="text-center font-semibold text-emerald-300">{l.presencas}</td>
                    <td className={`text-center font-semibold ${l.faltas ? "text-red-300" : "text-slate-500"}`}>
                      {l.faltas}
                      {l.justificados > 0 && <span className="text-[10px] text-blue-300"> +{l.justificados}j</span>}
                    </td>
                    <td className="text-center">
                      {l.operacoes}
                      {l.ultimaOperacao && <div className="text-[10px] text-slate-500">{fmtData(l.ultimaOperacao)}</div>}
                    </td>
                    <td className="text-center">
                      {l.promocoes}
                      {l.ultimaPromocao && <div className="text-[10px] text-slate-500">{fmtData(l.ultimaPromocao)}</div>}
                    </td>
                    <td className="text-center">{l.condecoracoes}</td>
                    <td className="text-center">{l.qualificacoes}</td>
                    <td className="text-center text-slate-300">
                      {l.diasServico}d<div className="text-[10px] text-slate-500">{fmtData(l.dataAlistamento)}</div>
                    </td>
                    <td className="text-center font-bold text-gold-300">{l.pontuacao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-white/5 px-5 py-3 text-[11px] text-slate-500">
          Pontuação de progresso: presença +3 · operação +4 · qualificação +5 · promoção +6 · condecoração +8 · falta
          justificada +1 · falta −2. Assiduidade = presenças ÷ eventos elegíveis (toda a Taskforce ou da unidade do militar,
          após o alistamento).
        </div>
      </Panel>
    </div>
  );
}
