import { db } from "@/db";
import { PageHeader, Panel, Campo } from "@/components/ui";
import { exigirEdicao } from "@/lib/auth";
import { criarMilitar } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function NovoMilitar() {
  await exigirEdicao();
  const [patentes, cargos, specs, estados, unidades] = await Promise.all([
    db.query.ranks.findMany({ orderBy: (r, { asc }) => asc(r.ordem) }),
    db.query.positions.findMany({ orderBy: (r, { asc }) => asc(r.ordem) }),
    db.query.specialties.findMany({ orderBy: (r, { asc }) => asc(r.ordem) }),
    db.query.statuses.findMany({ orderBy: (r, { asc }) => asc(r.ordem) }),
    db.query.units.findMany({ orderBy: (r, { asc }) => asc(r.ordem) }),
  ]);
  return (
    <div>
      <PageHeader titulo="Novo militar" subtitulo="Adicionar efectivo ao PERSCOM." />
      <Panel>
        <form action={criarMilitar} className="grid gap-3 md:grid-cols-2">
          <Campo label="Nome">
            <input name="nome" className="input" required />
          </Campo>
          <Campo label="Nome de guerra">
            <input name="nomeGuerra" className="input" />
          </Campo>
          <Campo label="Nº serviço">
            <input name="numeroServico" className="input" />
          </Campo>
          <Campo label="Discord">
            <input name="discord" className="input" />
          </Campo>
          <Campo label="Foto (URL)">
            <input name="foto" className="input" />
          </Campo>
          <Campo label="Patente">
            <select name="rankId" className="input">
              <option value="">—</option>
              {patentes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.abreviatura} — {p.nome}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Cargo">
            <select name="positionId" className="input">
              <option value="">—</option>
              {cargos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Especialidade">
            <select name="specialtyId" className="input">
              <option value="">—</option>
              {specs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.abreviatura}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Estado">
            <select name="statusId" className="input">
              <option value="">—</option>
              {estados.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Unidade">
            <select name="unitId" className="input">
              <option value="">—</option>
              {unidades.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </Campo>
          <div className="md:col-span-2">
            <Campo label="Bio">
              <textarea name="bio" className="input min-h-24" />
            </Campo>
          </div>
          <div>
            <button className="btn btn-primary">Criar</button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
