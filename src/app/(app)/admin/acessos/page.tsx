import Link from "next/link";
import { db } from "@/db";
import { NOME_ROLE, ROLES } from "@/db/schema";
import { exigirComando } from "@/lib/auth";
import { aprovarRegisto, bloquearConta, desbloquearConta, guardarAbasRole, guardarAbasUser } from "@/lib/actions";
import { PageHeader, Panel, Tag, Vazio } from "@/components/ui";
import { Insignia } from "@/components/insignia";
import { nomeCompleto } from "@/lib/format";
import { ABAS_CONFIGURAVEIS, mapaAbasRole, mapaAbasUser } from "@/lib/abas";

export const dynamic = "force-dynamic";

export default async function AcessosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string; user?: string }>;
}) {
  const sessao = await exigirComando();
  const { erro, user } = await searchParams;
  const lista = await db.query.users.findMany({ with: { rank: true, unit: true } });
  lista.sort((a, b) => (a.role === b.role ? (b.rank?.ordem ?? 0) - (a.rank?.ordem ?? 0) : a.role.localeCompare(b.role)));
  const pendentes = lista.filter((u) => u.passwordHash && u.contaEstado === "pendente");
  const activas = lista.filter((u) => u.passwordHash && u.contaEstado === "aprovada");
  const bloqueadas = lista.filter((u) => u.passwordHash && u.contaEstado === "bloqueada");
  const abasOp = await mapaAbasRole("operador");
  const abasEd = await mapaAbasRole("editor");
  const userEdit = user ? activas.find((u) => String(u.id) === user) : undefined;
  const abasUser = userEdit ? await mapaAbasUser(userEdit.id) : {};
  const temPersonalizado = Object.keys(abasUser).length > 0;

  return (
    <div>
      <PageHeader titulo="Acessos e permissões" subtitulo="O Comando define quem entra e quais abas cada perfil pode abrir." />
      {erro && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          Não podes bloquear a tua própria conta.
        </div>
      )}
      <div className="space-y-4">
        <Panel titulo="Abas dos operadores">
          <p className="mb-3 text-sm text-slate-400">
            Marca as abas que um operador vê por defeito. O Comando vê sempre tudo. Podes depois personalizar militar a militar.
          </p>
          <form action={guardarAbasRole}>
            <input type="hidden" name="role" value="operador" />
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {ABAS_CONFIGURAVEIS.filter((a) => !("editor" in a && a.editor) && !("soOficial" in a && a.soOficial)).map((a) => (
                <label key={a.href} className="flex items-center gap-2 rounded-lg border border-white/10 px-2 py-1.5 text-sm">
                  <input type="checkbox" name="tab" value={a.href} defaultChecked={abasOp[a.href] !== false} />
                  {a.label}
                </label>
              ))}
            </div>
            <button className="btn btn-primary mt-3">Guardar abas de operador</button>
          </form>
        </Panel>

        <Panel titulo="Abas dos operadores c/ permissão (editores)">
          <form action={guardarAbasRole}>
            <input type="hidden" name="role" value="editor" />
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {ABAS_CONFIGURAVEIS.filter((a) => !("soOficial" in a && a.soOficial)).map((a) => (
                <label key={a.href} className="flex items-center gap-2 rounded-lg border border-white/10 px-2 py-1.5 text-sm">
                  <input type="checkbox" name="tab" value={a.href} defaultChecked={abasEd[a.href] !== false} />
                  {a.label}
                </label>
              ))}
            </div>
            <button className="btn btn-primary mt-3">Guardar abas de editor</button>
          </form>
        </Panel>

        <Panel titulo={`Registos pendentes (${pendentes.length})`} className={pendentes.length ? "!border-amber-500/40" : ""}>
          {pendentes.length === 0 ? (
            <Vazio texto="Sem registos pendentes." />
          ) : (
            <ul className="space-y-3">
              {pendentes.map((u) => (
                <li key={u.id} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <div className="font-semibold">
                    {nomeCompleto(u)} <span className="font-mono text-xs text-slate-400">· {u.login}</span>
                  </div>
                  <form action={aprovarRegisto} className="mt-3 flex flex-wrap gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <select name="role" defaultValue="operador" className="input !w-auto !py-1 text-xs">
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {NOME_ROLE[r]}
                        </option>
                      ))}
                    </select>
                    <button className="btn btn-primary !py-1.5 text-xs">Aprovar</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel titulo={`Contas activas (${activas.length})`} className="!p-0">
          <table className="table">
            <thead>
              <tr>
                <th>Militar</th>
                <th>Login</th>
                <th>Perfil</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {activas.map((u) => (
                <tr key={u.id}>
                  <td>
                    <span className="flex items-center gap-2">
                      <Insignia rank={u.rank} size={22} />
                      <Link href={`/pessoal/${u.id}`} className="hover:text-gold-300">
                        {nomeCompleto(u)}
                      </Link>
                      {u.id === sessao.id && <Tag tone="slate">tu</Tag>}
                    </span>
                  </td>
                  <td className="font-mono text-xs">{u.login}</td>
                  <td>
                    <Tag tone={u.role === "comando" ? "gold" : u.role === "editor" ? "green" : "slate"}>
                      {NOME_ROLE[u.role as keyof typeof NOME_ROLE] ?? u.role}
                    </Tag>
                  </td>
                  <td className="text-right whitespace-nowrap">
                    {u.role !== "comando" && (
                      <Link href={`/admin/acessos?user=${u.id}`} className="btn btn-ghost !px-2 !py-1 text-xs">
                        Abas
                      </Link>
                    )}
                    {u.id !== sessao.id && (
                      <form action={bloquearConta} className="inline">
                        <input type="hidden" name="id" value={u.id} />
                        <button className="btn btn-danger !px-2 !py-1 text-xs">Bloquear</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        {userEdit && userEdit.role !== "comando" && (
          <Panel titulo={`Abas de ${nomeCompleto(userEdit)}`}>
            <p className="mb-3 text-sm text-slate-400">
              Personaliza as abas deste militar. Se escolheres “usar padrão do perfil”, voltam as abas do operador/editor.
            </p>
            <form action={guardarAbasUser} className="space-y-3">
              <input type="hidden" name="userId" value={userEdit.id} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="padrao" defaultChecked={!temPersonalizado} />
                Usar padrão do perfil ({NOME_ROLE[userEdit.role as keyof typeof NOME_ROLE] ?? userEdit.role})
              </label>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {ABAS_CONFIGURAVEIS.filter((a) => userEdit.role === "editor" || !("editor" in a && a.editor)).map((a) => (
                  <label key={a.href} className="flex items-center gap-2 rounded-lg border border-white/10 px-2 py-1.5 text-sm">
                    <input
                      type="checkbox"
                      name="tab"
                      value={a.href}
                      defaultChecked={temPersonalizado ? abasUser[a.href] === true : true}
                    />
                    {a.label}
                  </label>
                ))}
              </div>
              <button className="btn btn-primary">Guardar abas deste militar</button>
            </form>
          </Panel>
        )}

        {bloqueadas.length > 0 && (
          <Panel titulo="Bloqueadas">
            {bloqueadas.map((u) => (
              <form key={u.id} action={desbloquearConta} className="mb-2 flex items-center justify-between">
                <span>{nomeCompleto(u)}</span>
                <input type="hidden" name="id" value={u.id} />
                <button className="btn btn-secondary !py-1 text-xs">Desbloquear</button>
              </form>
            ))}
          </Panel>
        )}
      </div>
    </div>
  );
}
