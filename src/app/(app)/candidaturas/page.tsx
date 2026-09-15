import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { enlistmentApplications } from "@/db/schema";
import { PageHeader, Panel, EstadoCandidatura, Vazio } from "@/components/ui";
import { fmtDataHora } from "@/lib/format";
import { exigirEdicao } from "@/lib/auth";
import { decidirCandidatura } from "@/lib/actions";
import { servidorSeleccionado } from "@/lib/servidor";

export const dynamic = "force-dynamic";

const FILTROS = ["Todas", "Pendente", "Em Análise", "Aceite", "Rejeitada"] as const;

export default async function CandidaturasPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  await exigirEdicao();
  const { estado } = await searchParams;
  const srv = await servidorSeleccionado();
  const todas = await db.query.enlistmentApplications.findMany({ orderBy: [desc(enlistmentApplications.data)] });
  const doSrv = srv ? todas.filter((c) => !c.serverId || c.serverId === srv.id) : todas;
  const filtro = FILTROS.includes((estado as (typeof FILTROS)[number]) ?? "Todas") ? (estado ?? "Todas") : "Todas";
  const lista = filtro === "Todas" ? doSrv : doSrv.filter((c) => c.status === filtro || (filtro === "Aceite" && c.status === "Aprovada"));

  return (
    <div>
      <PageHeader
        titulo="Candidaturas"
        subtitulo="Submissões dos formulários de alistamento e pedidos internos."
      />
      <Link href="/alistamento" className="btn btn-secondary mb-4">
        Ver formulários públicos
      </Link>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTROS.map((f) => (
          <Link
            key={f}
            href={f === "Todas" ? "/candidaturas" : `/candidaturas?estado=${encodeURIComponent(f)}`}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              filtro === f ? "border-gold-500/50 bg-gold-500/20 text-gold-300" : "border-white/10 text-slate-400"
            }`}
          >
            {f}
          </Link>
        ))}
      </div>
      {lista.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gold-500/20 px-4 py-16 text-center text-slate-500">
          Sem candidaturas.
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((c) => (
            <Panel key={c.id} titulo={c.nome} accoes={<EstadoCandidatura status={c.status} />}>
              <p className="text-sm text-slate-400">
                {c.nomeGuerra && `“${c.nomeGuerra}” · `}
                {c.discord} · {c.idade} anos · {fmtDataHora(c.data)}
              </p>
              <p className="mt-2 text-sm">{c.experiencia}</p>
              <p className="mt-1 text-sm italic text-slate-300">{c.motivacao}</p>
              {(c.status === "Pendente" || c.status === "Em Análise") && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={decidirCandidatura}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="status" value="Em Análise" />
                    <button className="btn btn-ghost">Em análise</button>
                  </form>
                  <form action={decidirCandidatura}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="status" value="Aceite" />
                    <button className="btn btn-primary">Aceitar</button>
                  </form>
                  <form action={decidirCandidatura}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="status" value="Rejeitada" />
                    <button className="btn btn-danger">Rejeitar</button>
                  </form>
                </div>
              )}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
