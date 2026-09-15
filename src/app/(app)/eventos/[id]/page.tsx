import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import { PageHeader, Panel, Tag, Campo, SoEditores } from "@/components/ui";
import { fmtDataHora, corTipo } from "@/lib/format";
import { exigirSessao } from "@/lib/auth";
import { marcarPresenca, actualizarEvento } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function EventoPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await exigirSessao();
  const { id } = await params;
  const e = await db.query.events.findFirst({
    where: eq(events.id, Number(id)),
    with: { unit: true, attendance: { with: { user: { with: { rank: true } } } } },
  });
  if (!e) notFound();
  const minha = e.attendance.find((a) => a.userId === u.id);
  return (
    <div>
      <PageHeader
        titulo={e.titulo}
        subtitulo={`${e.tipo} · ${fmtDataHora(e.dataInicio)}`}
        accoes={e.obrigatorio ? <Tag tone="red">Obrigatório</Tag> : <Tag>Voluntário</Tag>}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" titulo="Briefing">
          <div className="text-sm" style={{ color: corTipo(e.tipo) }}>
            {e.tipo} · {e.local ?? "Local a definir"} · {e.unit?.nome ?? "Unidade geral"}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-slate-300">{e.briefing ?? "Sem briefing."}</p>
        </Panel>
        <Panel titulo="A tua presença">
          <form action={marcarPresenca} className="space-y-2">
            <input type="hidden" name="eventId" value={e.id} />
            {["Presente", "Talvez", "Ausente", "Justificado"].map((est) => (
              <button
                key={est}
                name="estado"
                value={est}
                className={`btn w-full ${minha?.estado === est ? "btn-primary" : "btn-ghost"}`}
              >
                {est}
              </button>
            ))}
          </form>
        </Panel>
        <SoEditores>
          <Panel titulo="Alterar evento" className="lg:col-span-3">
            <form action={actualizarEvento} className="grid gap-3 md:grid-cols-2">
              <input type="hidden" name="id" value={e.id} />
              <Campo label="Título">
                <input name="titulo" className="input" defaultValue={e.titulo} />
              </Campo>
              <Campo label="Tipo">
                <select name="tipo" className="input" defaultValue={e.tipo}>
                  <option>Treino</option>
                  <option>Missão</option>
                  <option>Operação</option>
                  <option>Reunião</option>
                </select>
              </Campo>
              <Campo label="Início">
                <input
                  name="dataInicio"
                  type="datetime-local"
                  className="input"
                  defaultValue={new Date(e.dataInicio.getTime() - e.dataInicio.getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 16)}
                />
              </Campo>
              <Campo label="Local">
                <input name="local" className="input" defaultValue={e.local ?? ""} />
              </Campo>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="obrigatorio" defaultChecked={e.obrigatorio} /> Obrigatório
              </label>
              <div className="md:col-span-2">
                <Campo label="Briefing">
                  <textarea name="briefing" className="input min-h-24" defaultValue={e.briefing ?? ""} />
                </Campo>
              </div>
              <button className="btn btn-primary">Guardar e notificar efectivo</button>
            </form>
          </Panel>
        </SoEditores>
        <Panel titulo="Presenças" className="lg:col-span-3">
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {e.attendance.map((a) => (
              <li key={a.id} className="rounded-lg border border-white/5 px-3 py-2 text-sm">
                <span className="text-gold-400">{a.user.rank?.abreviatura}</span> {a.user.nomeGuerra ?? a.user.nome}
                <span className="ml-2 text-xs text-slate-500">{a.estado}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
