import { desc } from "drizzle-orm";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { PageHeader, Panel, Vazio } from "@/components/ui";
import { fmtDataHora } from "@/lib/format";
import { exigirSessao } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ActualizacoesPage() {
  await exigirSessao();
  const lista = await db.query.auditLog.findMany({ orderBy: [desc(auditLog.criadoEm)], limit: 80 });
  return (
    <div>
      <PageHeader titulo="Actualizações" subtitulo="Registo de alterações no PERSCOM." />
      <Panel>
        {lista.length === 0 ? (
          <Vazio texto="Sem registos." />
        ) : (
          <ul className="space-y-3">
            {lista.map((a) => (
              <li key={a.id} className="border-b border-white/5 pb-2">
                <div className="text-sm">
                  <span className="text-gold-400">{a.actor ?? "Sistema"}</span> · {a.accao}
                </div>
                {a.detalhe && <div className="text-sm text-slate-400">{a.detalhe}</div>}
                <div className="text-[11px] text-slate-500">{fmtDataHora(a.criadoEm)}</div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
