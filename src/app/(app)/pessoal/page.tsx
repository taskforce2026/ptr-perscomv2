import Link from "next/link";
import { db } from "@/db";
import { users } from "@/db/schema";
import { and, eq, ilike, or, type SQL } from "drizzle-orm";
import { PageHeader, Panel, StatusBadge, Vazio, SoEditores } from "@/components/ui";
import { fmtData } from "@/lib/format";
import { Insignia } from "@/components/insignia";
import { exigirSessao, podeEditar } from "@/lib/auth";
import { apagarOperador } from "@/lib/actions";

export const dynamic = "force-dynamic";

type SP = Promise<{ q?: string; estado?: string; unidade?: string; patente?: string; erro?: string; apagado?: string }>;

export default async function PessoalPage({ searchParams }: { searchParams: SP }) {
  const sessao = await exigirSessao();
  const podeApagar = podeEditar(sessao);
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";

  const [estados, unidades, patentes] = await Promise.all([
    db.query.statuses.findMany({ orderBy: (s, { asc }) => asc(s.ordem) }),
    db.query.units.findMany({ orderBy: (u, { asc }) => asc(u.ordem) }),
    db.query.ranks.findMany({ orderBy: (r, { asc }) => asc(r.ordem) }),
  ]);

  const conds: SQL[] = [];
  if (q) {
    conds.push(
      or(
        ilike(users.nome, `%${q}%`),
        ilike(users.nomeGuerra, `%${q}%`),
        ilike(users.numeroServico, `%${q}%`),
        ilike(users.discord, `%${q}%`),
      )!,
    );
  }
  const estadoSel = estados.find((e) => e.nome === sp.estado || String(e.id) === sp.estado);
  if (estadoSel) conds.push(eq(users.statusId, estadoSel.id));
  if (sp.unidade) conds.push(eq(users.unitId, Number(sp.unidade)));
  if (sp.patente) conds.push(eq(users.rankId, Number(sp.patente)));

  const lista = await db.query.users.findMany({
    where: conds.length ? and(...conds) : undefined,
    with: { rank: true, position: true, specialty: true, status: true, unit: true },
  });
  lista.sort((a, b) => (b.rank?.ordem ?? 0) - (a.rank?.ordem ?? 0) || a.nome.localeCompare(b.nome));

  return (
    <div>
      <PageHeader
        titulo="Pessoal"
        subtitulo={`${lista.length} militar(es) encontrado(s)`}
        accoes={
          <SoEditores>
            <Link href="/pessoal/novo" className="btn btn-primary">
              + Novo Militar
            </Link>
          </SoEditores>
        }
      />

      {sp.apagado && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          Ficheiro do operador removido.
        </div>
      )}
      {sp.erro === "tu" && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          Não podes apagar o teu próprio ficheiro.
        </div>
      )}

      <Panel className="mb-4">
        <form className="grid grid-cols-2 gap-3 lg:grid-cols-5" method="get">
          <input name="q" defaultValue={q} placeholder="Pesquisar nome, nº serviço, Discord…" className="input col-span-2" />
          <select name="estado" defaultValue={estadoSel ? String(estadoSel.id) : ""} className="input">
            <option value="">Todos os estados</option>
            {estados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
          <select name="unidade" defaultValue={sp.unidade ?? ""} className="input">
            <option value="">Todas as unidades</option>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <select name="patente" defaultValue={sp.patente ?? ""} className="input">
              <option value="">Todas as patentes</option>
              {patentes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.abreviatura} — {p.nome}
                </option>
              ))}
            </select>
            <button className="btn btn-secondary">Filtrar</button>
          </div>
        </form>
      </Panel>

      {lista.length === 0 ? (
        <Vazio texto="Nenhum militar corresponde aos critérios." />
      ) : (
        <>
          <div className="panel hidden overflow-x-auto rounded-xl md:block">
            <table className="table">
              <thead>
                <tr>
                  <th>Patente</th>
                  <th>Nome</th>
                  <th>Nº Serviço</th>
                  <th>Unidade</th>
                  <th>Cargo</th>
                  <th>Especialidade</th>
                  <th>Estado</th>
                  <th>Alistamento</th>
                  {podeApagar && <th></th>}
                </tr>
              </thead>
              <tbody>
                {lista.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <Insignia rank={u.rank} size={26} mostrarSigla />
                    </td>
                    <td>
                      <Link href={`/pessoal/${u.id}`} className="font-medium hover:text-gold-300">
                        {u.nome}
                        {u.nomeGuerra && <span className="text-slate-400"> “{u.nomeGuerra}”</span>}
                      </Link>
                    </td>
                    <td className="font-mono text-xs text-slate-400">{u.numeroServico ?? "—"}</td>
                    <td>{u.unit?.nome ?? "—"}</td>
                    <td className="text-slate-300">{u.position?.nome ?? "—"}</td>
                    <td className="text-slate-300">{u.specialty?.abreviatura ?? "—"}</td>
                    <td>{u.status ? <StatusBadge nome={u.status.nome} cor={u.status.cor} /> : "—"}</td>
                    <td className="text-slate-400">{fmtData(u.dataAlistamento)}</td>
                    {podeApagar && (
                      <td className="text-right">
                        <form action={apagarOperador}>
                          <input type="hidden" name="id" value={u.id} />
                          <button className="btn btn-danger !px-2 !py-1 text-xs" title="Apagar ficheiro do operador">
                            🗑
                          </button>
                        </form>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-2 md:hidden">
            {lista.map((u) => (
              <Link key={u.id} href={`/pessoal/${u.id}`} className="panel flex items-center gap-3 rounded-xl p-4">
                <Insignia rank={u.rank} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">
                    <span className="text-gold-400">{u.rank?.abreviatura}</span> {u.nome}{" "}
                    {u.nomeGuerra && <span className="text-slate-400">“{u.nomeGuerra}”</span>}
                  </div>
                  <div className="truncate text-xs text-slate-400">
                    {u.unit?.nome ?? "Sem unidade"} · {u.position?.nome ?? "Sem cargo"}
                  </div>
                </div>
                {u.status && <StatusBadge nome={u.status.nome} cor={u.status.cor} />}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
