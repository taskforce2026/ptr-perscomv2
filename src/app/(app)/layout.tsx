import type { ReactNode } from "react";
import { Sidebar, MobileHeader, MobileTabBar } from "@/components/nav";
import { TabGuard } from "@/components/tab-guard";
import { exigirSessao, podeEditar, eComando, eOficial } from "@/lib/auth";
import { abasDoUtilizador } from "@/lib/abas";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const u = await exigirSessao();
  const abas = await abasDoUtilizador(u);
  const [pendentes, notifs] = await Promise.all([
    eComando(u)
      ? db.select({ n: sql<number>`count(*)::int` }).from(users).where(eq(users.contaEstado, "pendente")).then((r) => r[0].n)
      : Promise.resolve(0),
    db.query.notifications.findMany({
      where: eq(notifications.userId, u.id),
      orderBy: [desc(notifications.criadoEm)],
      limit: 25,
    }),
  ]);
  const sessao = {
    pendentes,
    nome: u.nomeGuerra ?? u.nome,
    patente: u.rank?.abreviatura ?? null,
    insignia: u.rank?.imagem ?? null,
    role: u.role,
    podeEditar: podeEditar(u),
    eComando: eComando(u),
    eOficial: eOficial(u),
    abas,
  };
  const notificacoes = notifs.map((n) => ({
    id: n.id,
    titulo: n.titulo,
    corpo: n.corpo,
    href: n.href,
    lida: n.lida,
    criadoEm: n.criadoEm.toISOString(),
  }));
  return (
    <>
      <TabGuard abas={abas} eComando={eComando(u)} />
      <div className="flex min-h-screen">
        <Sidebar sessao={sessao} notificacoes={notificacoes} />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileHeader sessao={sessao} notificacoes={notificacoes} />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 pb-24 lg:px-8 lg:py-8 lg:pb-8">{children}</main>
        </div>
      </div>
      <MobileTabBar abas={abas} />
    </>
  );
}
