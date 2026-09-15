import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { exigirChatComando } from "@/lib/auth";
import { ChatBox } from "@/components/chat";
import { PushToggle } from "@/components/push-toggle";

export const dynamic = "force-dynamic";

export default async function ChatComandoPage() {
  const u = await exigirChatComando();
  const oficiais = await db.query.users.findMany({
    where: or(eq(users.role, "comando"), eq(users.role, "editor")),
    with: { rank: true },
  });
  oficiais.sort((a, b) => (b.rank?.ordem ?? 0) - (a.rank?.ordem ?? 0) || a.nome.localeCompare(b.nome));
  return (
    <div>
      <div className="mb-2 flex justify-end">
        <PushToggle />
      </div>
      <ChatBox
      canal="comando"
      titulo="Chat de comando e oficiais"
      subtitulo="Canal reservado ao Comando e oficiais. Escolhe um oficial para conversa privada ou fala no canal geral. Fotos e apagar mensagens incluídos."
      meId={u.id}
      canModerate
      operadores={oficiais.map((o) => ({
        id: o.id,
        nome: o.nome,
        nomeGuerra: o.nomeGuerra,
        abrev: o.rank?.abreviatura ?? null,
      }))}
      />
    </div>
  );
}
