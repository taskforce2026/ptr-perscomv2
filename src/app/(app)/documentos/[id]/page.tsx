import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { PageHeader, Panel, Campo } from "@/components/ui";
import { exigirEdicao } from "@/lib/auth";
import { actualizarDocumento, emitirDocumento } from "@/lib/actions";
import { TIPOS_DOCUMENTO } from "@/lib/documentos";

export const dynamic = "force-dynamic";

export default async function ModeloPage({ params }: { params: Promise<{ id: string }> }) {
  await exigirEdicao();
  const { id } = await params;
  if (id === "emitidos") notFound();
  const modelo = await db.query.documents.findFirst({ where: eq(documents.id, Number(id)) });
  if (!modelo) notFound();
  const militares = await db.query.users.findMany({ with: { rank: true } });
  militares.sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <div>
      <PageHeader titulo={modelo.titulo} subtitulo="Editar modelo e emitir certificado / ordem a um operador." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel titulo="Editar modelo">
          <form action={actualizarDocumento} className="space-y-3">
            <input type="hidden" name="id" value={modelo.id} />
            <Campo label="Título">
              <input name="titulo" className="input" defaultValue={modelo.titulo} />
            </Campo>
            <Campo label="Tipo">
              <select name="tipo" className="input" defaultValue={modelo.tipo}>
                {TIPOS_DOCUMENTO.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Campo>
            <Campo label="Referência">
              <input name="referencia" className="input" defaultValue={modelo.referencia ?? ""} />
            </Campo>
            <Campo label="Corpo">
              <textarea name="corpo" className="input min-h-64 font-mono text-sm" defaultValue={modelo.corpo} />
            </Campo>
            <button className="btn btn-primary">Guardar alterações</button>
          </form>
        </Panel>
        <Panel titulo="Emitir a um operador">
          <form action={emitirDocumento} className="space-y-3">
            <input type="hidden" name="documentId" value={modelo.id} />
            <Campo label="Operador">
              <select name="userId" className="input" required>
                {militares.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.rank?.abreviatura} {m.nome} {m.nomeGuerra ? `“${m.nomeGuerra}”` : ""}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Missão / operação / curso (livre)">
              <input name="p_missao" className="input" />
            </Campo>
            <Campo label="Treino">
              <input name="p_treino" className="input" />
            </Campo>
            <Campo label="Qualificação">
              <input name="p_qualificacao" className="input" />
            </Campo>
            <Campo label="Curso">
              <input name="p_curso" className="input" />
            </Campo>
            <Campo label="Classificação">
              <input name="p_classificacao" className="input" />
            </Campo>
            <Campo label="Nova patente">
              <input name="p_novaPatente" className="input" />
            </Campo>
            <Campo label="Operação (AAR)">
              <input name="p_operacao" className="input" />
            </Campo>
            <Campo label="Notas internas">
              <textarea name="notas" className="input min-h-16" />
            </Campo>
            <button className="btn btn-primary">Emitir documento CONFIDENCIAL</button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
