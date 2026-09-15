import { db } from "@/db";
import { PageHeader, Panel, Campo } from "@/components/ui";
import { exigirEdicao } from "@/lib/auth";
import { criarEvento } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function NovoEvento() {
  await exigirEdicao();
  const unidades = await db.query.units.findMany({ orderBy: (u, { asc }) => asc(u.ordem) });
  return (
    <div>
      <PageHeader titulo="Novo evento" />
      <Panel>
        <form action={criarEvento} className="grid gap-3 md:grid-cols-2">
          <Campo label="Título">
            <input name="titulo" className="input" required />
          </Campo>
          <Campo label="Tipo">
            <select name="tipo" className="input">
              <option>Treino</option>
              <option>Missão</option>
              <option>Operação</option>
              <option>Reunião</option>
            </select>
          </Campo>
          <Campo label="Início">
            <input name="dataInicio" type="datetime-local" className="input" required />
          </Campo>
          <Campo label="Local">
            <input name="local" className="input" />
          </Campo>
          <Campo label="Unidade">
            <select name="unitId" className="input">
              <option value="">Geral</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </Campo>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" name="obrigatorio" /> Obrigatório
          </label>
          <div className="md:col-span-2">
            <Campo label="Briefing">
              <textarea name="briefing" className="input min-h-32" />
            </Campo>
          </div>
          <button className="btn btn-primary">Agendar</button>
        </form>
      </Panel>
    </div>
  );
}
