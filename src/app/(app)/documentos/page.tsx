import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents, userDocuments } from "@/db/schema";
import { PageHeader, Panel, Campo, Vazio } from "@/components/ui";
import { eComando, exigirSessao, podeEditar } from "@/lib/auth";
import { criarDocumento, apagarDocumento, apagarEmissao } from "@/lib/actions";
import { TIPOS_DOCUMENTO } from "@/lib/documentos";
import { fmtData } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DocumentosPage() {
  const u = await exigirSessao();
  const admin = podeEditar(u);
  const [modelos, meus, todosEmitidos] = await Promise.all([
    db.query.documents.findMany({ orderBy: [desc(documents.criadoEm)] }),
    db.query.userDocuments.findMany({
      where: eq(userDocuments.userId, u.id),
      orderBy: [desc(userDocuments.criadoEm)],
      with: { document: true, user: true },
    }),
    admin
      ? db.query.userDocuments.findMany({
          orderBy: [desc(userDocuments.criadoEm)],
          with: { document: true, user: { with: { rank: true } } },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <PageHeader
        titulo="Documentos oficiais"
        subtitulo="Modelos CONFIDENTIAIS da PTR. Só o Comando emite certificados. Cada operador exporta os seus."
      />

      <Panel titulo="Os meus documentos" className="mb-4">
        {meus.length === 0 ? (
          <Vazio texto="Ainda não te foi atribuído nenhum documento." />
        ) : (
          <ul className="space-y-2">
            {meus.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gold-500/15 px-3 py-2">
                <div>
                  <div className="font-semibold text-gold-200">{e.document.titulo}</div>
                  <div className="text-xs text-slate-500">
                    {e.numero} · {e.document.tipo} · {fmtData(e.criadoEm)}
                  </div>
                </div>
                <Link href={`/documentos/emitidos/${e.id}`} className="btn btn-primary !py-1.5 text-xs">
                  Ver / PDF
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {admin && (
        <>
          <Panel titulo="Emitidos pela administração" className="mb-4">
            {todosEmitidos.length === 0 ? (
              <Vazio texto="Nenhuma emissão." />
            ) : (
              <ul className="space-y-2">
                {todosEmitidos.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2">
                    <div>
                      <div className="font-semibold">
                        {e.document.titulo}{" "}
                        <span className="text-slate-400">
                          → {e.user.rank?.abreviatura} {e.user.nomeGuerra ?? e.user.nome}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">{e.numero}</div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/documentos/emitidos/${e.id}`} className="btn btn-ghost !py-1 text-xs">
                        Abrir
                      </Link>
                      <form action={apagarEmissao}>
                        <input type="hidden" name="id" value={e.id} />
                        <button className="btn btn-danger !py-1 text-xs">Apagar</button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel titulo="Novo modelo" className="mb-4">
            <form action={criarDocumento} className="grid gap-3 md:grid-cols-2">
              <Campo label="Título">
                <input name="titulo" className="input" required />
              </Campo>
              <Campo label="Tipo">
                <select name="tipo" className="input">
                  {TIPOS_DOCUMENTO.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Campo>
              <Campo label="Referência">
                <input name="referencia" className="input" placeholder="PTR-CERT-…" />
              </Campo>
              <div className="md:col-span-2">
                <Campo label="Corpo (placeholders {{nome}} {{patente}} {{unidade}} {{data}} …)">
                  <textarea name="corpo" className="input min-h-40 font-mono text-sm" required />
                </Campo>
              </div>
              <button className="btn btn-primary">Criar modelo</button>
            </form>
          </Panel>

          <div className="grid gap-3 lg:grid-cols-2">
            {modelos.map((m) => (
              <Panel key={m.id} titulo={`${m.tipo} · ${m.titulo}`}>
                <p className="mb-2 text-xs uppercase tracking-wider text-gold-500">{m.referencia}</p>
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-xs text-slate-400">{m.corpo.slice(0, 400)}</pre>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/documentos/${m.id}`} className="btn btn-secondary !py-1.5 text-xs">
                    Editar / Emitir
                  </Link>
                  {eComando(u) || admin ? (
                    <form action={apagarDocumento}>
                      <input type="hidden" name="id" value={m.id} />
                      <button className="btn btn-danger !py-1.5 text-xs">Apagar modelo</button>
                    </form>
                  ) : null}
                </div>
              </Panel>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
