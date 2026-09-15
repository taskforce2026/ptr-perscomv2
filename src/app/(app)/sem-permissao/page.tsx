import Link from "next/link";
import { PageHeader, Panel } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SemPermissao() {
  await exigirSessao();
  return (
    <div>
      <PageHeader titulo="Acesso negado" />
      <Panel>
        <p className="text-slate-300">Não tens permissão para esta área. O chat de comando é só para oficiais e Comando.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/" className="btn btn-primary">
            Painel
          </Link>
          <Link href="/chat/operadores" className="btn btn-secondary">
            Chat operadores
          </Link>
          <Link href="/holograma" className="btn btn-ghost">
            Holograma
          </Link>
        </div>
      </Panel>
    </div>
  );
}
