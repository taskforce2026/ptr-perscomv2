import Link from "next/link";
import { db } from "@/db";
import { PageHeader, Panel, Campo, StatusBadge, Vazio, SoEditores } from "@/components/ui";
import { Insignia } from "@/components/insignia";
import { FormConfirm } from "@/components/form-confirm";
import { exigirSessao } from "@/lib/auth";
import { servidorSeleccionado } from "@/lib/servidor";
import { guardarCatalogo, apagarCatalogo } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function RostersPage({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string }>;
}) {
  await exigirSessao();
  const { editar } = await searchParams;
  const srv = await servidorSeleccionado();
  const listas = await db.query.rosters.findMany({
    orderBy: (r, { asc }) => asc(r.ordem),
    with: {
      units: {
        orderBy: (u, { asc }) => asc(u.ordem),
        with: { users: { with: { rank: true, position: true, status: true } } },
      },
    },
  });
  const editando = editar ? listas.find((r) => String(r.id) === editar) : undefined;
  const todos = await db.query.users.findMany({
    with: { rank: true, position: true, status: true, unit: true },
  });
  const doServidor = (u: { serverId?: number | null }) => !srv || !u.serverId || u.serverId === srv.id;
  const semUnidade = todos.filter((u) => !u.unitId && doServidor(u));

  return (
    <div>
      <PageHeader
        titulo="Rosters"
        subtitulo={srv ? `Ordem de batalha · ${srv.nome}` : "Ordem de batalha da Phoenix Taskforce Rangers."}
      />

      <SoEditores>
        <Panel titulo={editando ? `Editar: ${editando.nome}` : "Novo roster"} className="mb-6">
          <form action={guardarCatalogo} className="grid gap-3 md:grid-cols-3">
            <input type="hidden" name="tipo" value="rosters" />
            {editando && <input type="hidden" name="id" value={editando.id} />}
            <Campo label="Nome *">
              <input name="nome" className="input" required defaultValue={editando?.nome ?? ""} />
            </Campo>
            <Campo label="Descrição">
              <input name="extra" className="input" defaultValue={editando?.descricao ?? ""} />
            </Campo>
            <Campo label="Ordem">
              <input name="ordem" type="number" className="input" defaultValue={editando?.ordem ?? listas.length + 1} />
            </Campo>
            <div className="flex flex-wrap gap-2 md:col-span-3">
              <button className="btn btn-primary">{editando ? "Guardar alterações" : "Adicionar roster"}</button>
              {editando && (
                <a href="/rosters" className="btn btn-ghost">
                  Cancelar
                </a>
              )}
            </div>
          </form>
        </Panel>
      </SoEditores>

      {listas.length === 0 ? (
        <Vazio texto="Sem rosters." />
      ) : (
        <div className="space-y-8">
          {listas.map((r) => (
            <section key={r.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-[family-name:var(--font-display)] text-2xl text-gold-300">
                  {r.nome}{" "}
                  {r.descricao && <span className="text-base font-normal text-slate-400">{r.descricao}</span>}
                </h2>
                <SoEditores>
                  <div className="flex gap-2">
                    <Link href={`/rosters?editar=${r.id}`} className="btn btn-ghost !py-1 text-xs">
                      Editar
                    </Link>
                    <FormConfirm
                      action={apagarCatalogo}
                      message={`Apagar o roster "${r.nome}"? As unidades ficam sem lista.`}
                    >
                      <input type="hidden" name="tipo" value="rosters" />
                      <input type="hidden" name="id" value={r.id} />
                      <button className="btn btn-danger !py-1 text-xs">Apagar</button>
                    </FormConfirm>
                  </div>
                </SoEditores>
              </div>
              <div className="mt-3 space-y-3">
                {r.units.map((un) => {
                  const efectivos = un.users.filter(doServidor).sort((a, b) => (b.rank?.ordem ?? 0) - (a.rank?.ordem ?? 0));
                  return (
                    <div key={un.id} className="panel overflow-hidden rounded-2xl !p-0">
                      <div className="flex items-start justify-between gap-3 px-4 py-3">
                        <div>
                          <div className="font-bold text-gold-300">{un.nome}</div>
                          <div className="text-sm text-slate-400">{un.descricao ?? un.abreviatura}</div>
                        </div>
                        <span className="grid h-7 min-w-7 place-items-center rounded-full border border-gold-500/30 text-xs text-gold-300">
                          {efectivos.length}
                        </span>
                      </div>
                      <div className="border-t border-gold-500/15 px-4 py-3">
                        {efectivos.length === 0 ? (
                          <p className="text-sm text-slate-500">Sem efectivos.</p>
                        ) : (
                          <ul className="space-y-2">
                            {efectivos.map((u) => (
                              <li key={u.id}>
                                <Link href={`/pessoal/${u.id}`} className="flex items-center gap-2 text-sm hover:text-gold-300">
                                  <Insignia rank={u.rank} size={22} />
                                  <span className="flex-1">
                                    {u.rank?.abreviatura ?? "—"} {u.nome}
                                    {u.nomeGuerra && ` “${u.nomeGuerra}”`}
                                    <span className="text-slate-500"> · {u.position?.nome ?? "—"}</span>
                                  </span>
                                  {u.status && <StatusBadge nome={u.status.nome} cor={u.status.cor} />}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          <section>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-gold-300">Sem unidade atribuída</h2>
            <div className="panel mt-3 overflow-hidden rounded-2xl !p-0">
              <div className="flex items-start justify-between px-4 py-3">
                <div>
                  <div className="font-bold text-gold-300">Não colocados</div>
                </div>
                <span className="grid h-7 min-w-7 place-items-center rounded-full border border-gold-500/30 text-xs text-gold-300">
                  {semUnidade.length}
                </span>
              </div>
              <div className="border-t border-gold-500/15 px-4 py-3">
                {semUnidade.length === 0 ? (
                  <p className="text-sm text-slate-500">Sem efectivos.</p>
                ) : (
                  <ul className="space-y-2">
                    {semUnidade.map((u) => (
                      <li key={u.id}>
                        <Link href={`/pessoal/${u.id}`} className="flex items-center gap-2 text-sm hover:text-gold-300">
                          <Insignia rank={u.rank} size={22} />
                          <span>
                            {u.nome}
                            {u.nomeGuerra && ` “${u.nomeGuerra}”`}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
