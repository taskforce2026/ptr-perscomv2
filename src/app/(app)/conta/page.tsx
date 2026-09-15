import { exigirSessao } from "@/lib/auth";
import { alterarMinhaPassword } from "@/lib/actions";
import { PageHeader, Panel, Campo, Tag } from "@/components/ui";
import { Insignia } from "@/components/insignia";
import { NOME_ROLE } from "@/db/schema";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ContaPage({ searchParams }: { searchParams: Promise<{ erro?: string; ok?: string }> }) {
  const { erro, ok } = await searchParams;
  const u = await exigirSessao();
  return (
    <div>
      <PageHeader titulo="A minha conta" subtitulo="Sessão, permissões e password." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel titulo="Sessão">
          <div className="flex items-center gap-3">
            <Insignia rank={u.rank} size={40} />
            <div>
              <div className="font-bold text-gold-300">
                {u.rank?.abreviatura} {u.nomeGuerra ?? u.nome}
              </div>
              <div className="text-xs text-slate-400">login: {u.login ?? "—"}</div>
            </div>
          </div>
          <div className="mt-3">
            <Tag tone={u.role === "comando" ? "gold" : u.role === "editor" ? "green" : "slate"}>
              {NOME_ROLE[u.role]}
            </Tag>
          </div>
          <Link href={`/pessoal/${u.id}`} className="btn btn-ghost mt-4">
            Ver o meu perfil
          </Link>
          <form action="/api/auth/logout" method="post" className="mt-3">
            <button className="btn btn-danger">Sair</button>
          </form>
        </Panel>
        <Panel titulo="Password" className="lg:col-span-2">
          {ok && <p className="mb-3 text-sm text-emerald-300">Password actualizada.</p>}
          {erro && <p className="mb-3 text-sm text-red-300">A password deve ter pelo menos 6 caracteres.</p>}
          <form action={alterarMinhaPassword} className="max-w-sm space-y-3">
            <Campo label="Nova password">
              <input name="password" type="password" className="input" required />
            </Campo>
            <button className="btn btn-primary">Alterar</button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
