import { db } from "@/db";
import { PageHeader, Panel, Campo, SoEditores, Vazio } from "@/components/ui";
import { exigirSessao, podeEditar } from "@/lib/auth";
import { guardarServidor, seleccionarServidor } from "@/lib/actions";
import { servidorSeleccionado } from "@/lib/servidor";
import { estadosServidores } from "@/lib/servidor-estado";
import { fmtDataHora } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ServidorPage() {
  await exigirSessao();
  const actual = await servidorSeleccionado();
  const [lista, estados] = await Promise.all([
    db.query.servers.findMany({ orderBy: (s, { asc }) => asc(s.ordem) }),
    estadosServidores(),
  ]);
  const estadoDe = new Map(estados.map((e) => [e.serverId, e]));
  const totalOnline = estados.reduce((s, e) => s + (e.online ? 1 : 0), 0);

  return (
    <div>
      <PageHeader
        titulo="Servidores"
        subtitulo={`O servidor Arma seleccionado alimenta as estatísticas. O monitor liga a cada :2306 e cruza o nome de guerra com o efectivo (${totalOnline} online agora).`}
      />

      <SoEditores>
        <Panel titulo="Acrescentar novo servidor" className="mb-4">
          <form action={guardarServidor} className="grid gap-3 md:grid-cols-3">
            <Campo label="Nome">
              <input name="nome" className="input" required placeholder="PTR Altis Ops" />
            </Campo>
            <Campo label="Tipo">
              <select name="tipo" className="input" defaultValue="Arma 3">
                <option>Arma 3</option>
                <option>TeamSpeak</option>
                <option>Discord</option>
              </select>
            </Campo>
            <Campo label="Endereço">
              <input name="endereco" className="input" placeholder="endereco.ddns.net" />
            </Campo>
            <Campo label="Porta">
              <input name="porta" className="input" defaultValue="2302" />
            </Campo>
            <Campo label="Password">
              <input name="password" className="input" />
            </Campo>
            <Campo label="Modpack">
              <input name="modpack" className="input" />
            </Campo>
            <div className="md:col-span-3">
              <Campo label="Notas">
                <textarea name="notas" className="input min-h-16" />
              </Campo>
            </div>
            <div>
              <button className="btn btn-primary">Adicionar servidor</button>
            </div>
          </form>
        </Panel>
      </SoEditores>

      {lista.length === 0 ? (
        <Vazio texto="Sem servidores configurados." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {lista.map((s) => {
            const estado = s.tipo === "Arma 3" ? estadoDe.get(s.id) : undefined;
            const emLinha = estado?.online && estado.jogadores.length > 0;
            return (
              <Panel key={s.id} titulo={`${s.tipo} · ${s.nome}`}>
                {actual?.id === s.id && (
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gold-400">Em uso nas estatísticas</p>
                )}
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Endereço</dt>
                    <dd className="font-mono">
                      {s.endereco ?? "—"}
                      {s.porta ? `:${s.porta}` : ""}
                    </dd>
                  </div>
                  {s.password && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Password</dt>
                      <dd className="font-mono">{s.password}</dd>
                    </div>
                  )}
                  {s.modpack && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Modpack</dt>
                      <dd>{s.modpack}</dd>
                    </div>
                  )}
                </dl>
                {s.notas && <p className="mt-3 text-sm text-slate-400">{s.notas}</p>}

                {s.tipo === "Arma 3" && estado && (
                  <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${estado.online ? "bg-emerald-400" : "bg-red-400"}`}
                      />
                      <b>{estado.online ? "Ligado" : "Offline / sem resposta"}</b>
                      <span className="text-slate-400">
                        · {estado.jogadores.length} jogador(es) · {estado.operadores.length} operador(es) PTR
                      </span>
                      <span className="ml-auto text-[10px] text-slate-500">
                        verificado {fmtDataHora(estado.actualizadoEm)}
                      </span>
                    </div>
                    {estado.operadores.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {estado.operadores.map((o) => (
                          <span
                            key={o.id}
                            className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200"
                          >
                            ● {o.nomeGuerra ?? o.nome}
                          </span>
                        ))}
                      </div>
                    )}
                    {emLinha && estado.operadores.length === 0 && (
                      <p className="mt-2 text-xs text-slate-500">
                        Jogadores no servidor ainda sem nome de guerra no PERSCOM: {estado.jogadores.join(", ")}.
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {s.tipo === "Arma 3" && (
                    <form action={seleccionarServidor}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="next" value="/estatisticas" />
                      <button className={actual?.id === s.id ? "btn btn-primary" : "btn btn-secondary"}>
                        {actual?.id === s.id ? "Seleccionado para estatísticas" : "Usar nas estatísticas"}
                      </button>
                    </form>
                  )}
                  {s.tipo === "Arma 3" && s.endereco && (
                    <a
                      className="btn btn-ghost"
                      href={`steam://run/107410//-connect=${s.endereco} -port=${s.porta ?? "2302"}`}
                    >
                      Ligar via Steam
                    </a>
                  )}
                </div>

                <SoEditores>
                  <details className="mt-4">
                    <summary className="cursor-pointer text-xs uppercase tracking-wider text-gold-500">
                      Editar servidor
                    </summary>
                    <form action={guardarServidor} className="mt-3 grid gap-2">
                      <input type="hidden" name="id" value={s.id} />
                      <Campo label="Nome">
                        <input name="nome" defaultValue={s.nome} className="input" />
                      </Campo>
                      <Campo label="Tipo">
                        <input name="tipo" defaultValue={s.tipo} className="input" />
                      </Campo>
                      <Campo label="Endereço">
                        <input name="endereco" defaultValue={s.endereco ?? ""} className="input" />
                      </Campo>
                      <Campo label="Porta">
                        <input name="porta" defaultValue={s.porta ?? ""} className="input" />
                      </Campo>
                      <Campo label="Password">
                        <input name="password" defaultValue={s.password ?? ""} className="input" />
                      </Campo>
                      <Campo label="Modpack">
                        <input name="modpack" defaultValue={s.modpack ?? ""} className="input" />
                      </Campo>
                      <Campo label="Notas">
                        <textarea name="notas" defaultValue={s.notas ?? ""} className="input" />
                      </Campo>
                      <button className="btn btn-primary">Guardar</button>
                    </form>
                  </details>
                </SoEditores>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
