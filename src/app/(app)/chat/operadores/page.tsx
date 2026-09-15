import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { exigirSessao, podeEditar } from "@/lib/auth";
import { ChatBox } from "@/components/chat";
import { PushToggle } from "@/components/push-toggle";

export const dynamic = "force-dynamic";

export default async function ChatOperadoresPage() {
  const u = await exigirSessao();
  const efectivo = await db.query.users.findMany({
    where: eq(users.contaEstado, "aprovada"),
    with: { rank: true },
  });
  efectivo.sort((a, b) => (b.rank?.ordem ?? 0) - (a.rank?.ordem ?? 0) || a.nome.localeCompare(b.nome));
  return (
    <div>
      <div className="mb-2 flex justify-end">
        <PushToggle />
      </div>
      <ChatBox
      canal="operadores"
      titulo="Chat dos operadores"
      subtitulo="Canal aberto a todo o efectivo. Escolhe um operador para conversa privada, ou fala com todos no canal geral. Fotos e apagar mensagens incluídos."
      meId={u.id}
      canModerate={podeEditar(u)}
      operadores={efectivo.map((o) => ({
        id: o.id,
        nome: o.nome,
        nomeGuerra: o.nomeGuerra,
        abrev: o.rank?.abreviatura ?? null,
      }))}
      />
    </div>
  );
}
