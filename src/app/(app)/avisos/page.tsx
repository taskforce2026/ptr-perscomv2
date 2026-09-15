import { desc } from "drizzle-orm";
import { db } from "@/db";
import { notices } from "@/db/schema";
import { PageHeader, Panel, Campo, SoEditores, Vazio } from "@/components/ui";
import { fmtDataHora } from "@/lib/format";
import { exigirSessao, podeEditar } from "@/lib/auth";
import { enviarAviso, apagarAviso } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function AvisosPage() {
  const u = await exigirSessao();
  const admin = podeEditar(u);
  const lista = await db.query.notices.findMany({ orderBy: [desc(notices.criadoEm)] });
  return (
    <div>
      <PageHeader titulo="Avisos" subtitulo="Comunicados gerais ao efectivo." />
      <SoEditores>
        <Panel titulo="Novo aviso" className="mb-4">
          <form action={enviarAviso} className="space-y-3">
            <Campo label="Título">
              <input name="titulo" className="input" required />
            </Campo>
            <Campo label="Mensagem">
              <textarea name="corpo" className="input min-h-28" required />
            </Campo>
            <button className="btn btn-primary">Enviar</button>
          </form>
        </Panel>
      </SoEditores>
      {lista.length === 0 ? (
        <Vazio texto="Sem avisos." />
      ) : (
        <div className="space-y-3">
          {lista.map((n) => (
            <Panel key={n.id} titulo={n.titulo}>
              <p className="whitespace-pre-wrap text-slate-300">{n.corpo}</p>
              <p className="mt-2 text-xs text-slate-500">
                {n.autor} · {fmtDataHora(n.criadoEm)}
              </p>
              {admin && (
                <form action={apagarAviso} className="mt-3">
                  <input type="hidden" name="id" value={n.id} />
                  <button className="btn btn-danger !py-1 text-xs">Apagar publicação</button>
                </form>
              )}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
