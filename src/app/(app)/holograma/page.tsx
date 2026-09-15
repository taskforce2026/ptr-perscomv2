import { db } from "@/db";
import { exigirSessao } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { HologramaScene } from "@/components/holograma";
import { servidorSeleccionado } from "@/lib/servidor";

export const dynamic = "force-dynamic";

export default async function HologramaPage() {
  await exigirSessao();
  const srv = await servidorSeleccionado();
  const operadoresAll = await db.query.users.findMany({
    with: { rank: true, unit: true, position: true, specialty: true, status: true },
  });
  const operadores = srv ? operadoresAll.filter((o) => !o.serverId || o.serverId === srv.id) : operadoresAll;
  operadores.sort((a, b) => (b.rank?.ordem ?? 0) - (a.rank?.ordem ?? 0));
  return (
    <div>
      <PageHeader
        titulo="Holograma de operadores"
        subtitulo={srv ? `Projecção táctica · ${srv.nome}` : "Projecção táctica de todo o efectivo."}
      />
      <HologramaScene
        operadores={operadores.map((o) => ({
          id: o.id,
          nome: o.nome,
          nomeGuerra: o.nomeGuerra,
          foto: o.foto,
          numeroServico: o.numeroServico,
          bio: o.bio,
          rank: o.rank,
          unit: o.unit,
          position: o.position,
          specialty: o.specialty ? { abreviatura: o.specialty.abreviatura } : null,
          status: o.status,
        }))}
      />
    </div>
  );
}
