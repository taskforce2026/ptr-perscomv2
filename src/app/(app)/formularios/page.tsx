import { desc } from "drizzle-orm";
import { db } from "@/db";
import { forms } from "@/db/schema";
import { PageHeader, Panel, Campo, Vazio, Tag } from "@/components/ui";
import { exigirEdicao } from "@/lib/auth";
import { criarFormulario, actualizarFormulario, apagarFormulario } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function FormulariosPage({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string; apagado?: string }>;
}) {
  await exigirEdicao();
  const { editar } = await searchParams;
  const lista = await db.query.forms.findMany({ orderBy: [desc(forms.id)] });
  const editando = editar ? lista.find((f) => String(f.id) === editar) : undefined;

  return (
    <div>
      <PageHeader titulo="Formulários" subtitulo="Cria, edita e apaga formulários da unidade." />

      <Panel titulo={editando ? `Editar: ${editando.titulo}` : "Novo formulário"} className="mb-4">
        <form
          action={editando ? actualizarFormulario : criarFormulario}
          className="grid gap-3 md:grid-cols-2"
        >
          {editando && <input type="hidden" name="id" value={editando.id} />}
          <Campo label="Título">
            <input name="titulo" className="input" required defaultValue={editando?.titulo ?? ""} />
          </Campo>
          <Campo label="Descrição">
            <input name="descricao" className="input" defaultValue={editando?.descricao ?? ""} />
          </Campo>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary">{editando ? "Guardar alterações" : "Criar"}</button>
            {editando && (
              <a href="/formularios" className="btn btn-ghost">
                Cancelar
              </a>
            )}
          </div>
        </form>
      </Panel>

      {lista.length === 0 ? (
        <Vazio texto="Sem formulários." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {lista.map((f) => (
            <Panel key={f.id} titulo={f.titulo}>
              <p className="text-sm text-slate-400">{f.descricao}</p>
              <div className="mt-1">
                <Tag tone={f.activo ? "green" : "slate"}>{f.activo ? "Activo" : "Inactivo"}</Tag>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={`/formularios?editar=${f.id}`} className="btn btn-ghost !py-1 text-xs">
                  Editar
                </a>
                <form action={apagarFormulario}>
                  <input type="hidden" name="id" value={f.id} />
                  <button className="btn btn-danger !py-1 text-xs">Apagar</button>
                </form>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
