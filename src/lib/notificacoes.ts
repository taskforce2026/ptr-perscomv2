import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";

export async function notificarTodos(opts: { titulo: string; corpo?: string; href?: string; tipo?: string }) {
  const efectivos = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.contaEstado, "aprovada"));
  if (efectivos.length === 0) return;
  await db.insert(notifications).values(
    efectivos.map((u) => ({
      userId: u.id,
      titulo: opts.titulo,
      corpo: opts.corpo ?? null,
      href: opts.href ?? null,
      tipo: opts.tipo ?? "evento",
    })),
  );
}
