import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userDocuments } from "@/db/schema";
import { exigirSessao, podeEditar } from "@/lib/auth";
import { DocumentoOficial } from "@/components/documento-oficial";
import { ExportarDocumento } from "@/components/exportar-doc";
import { fmtData } from "@/lib/format";
import { apagarEmissao } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function EmitidoPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await exigirSessao();
  const { id } = await params;
  const doc = await db.query.userDocuments.findFirst({
    where: eq(userDocuments.id, Number(id)),
    with: { document: true, user: { with: { rank: true } } },
  });
  if (!doc) notFound();
  if (!podeEditar(u) && doc.userId !== u.id) notFound();

  const destinatario = `${doc.user.rank?.abreviatura ?? ""} ${doc.user.nome} ${doc.user.nomeGuerra ? `“${doc.user.nomeGuerra}”` : ""}`.trim();

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href={`/pessoal/${doc.userId}?tab=documentos`} className="btn btn-ghost">
          ← Voltar
        </Link>
        <div className="flex gap-2">
          <ExportarDocumento ficheiro={doc.numero} />
          {podeEditar(u) && (
            <form action={apagarEmissao}>
              <input type="hidden" name="id" value={doc.id} />
              <button className="btn btn-danger">Apagar emissão</button>
            </form>
          )}
        </div>
      </div>
      <DocumentoOficial
        titulo={doc.document.titulo}
        tipo={doc.document.tipo}
        numero={doc.numero}
        corpo={doc.corpo}
        destinatario={destinatario}
        emitidoPor={doc.emitidoPor}
        data={fmtData(doc.criadoEm)}
      />
    </div>
  );
}
