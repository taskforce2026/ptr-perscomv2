import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { servers } from "@/db/schema";

export const COOKIE_SERVIDOR = "ptr_servidor";

export type Servidor = typeof servers.$inferSelect;

export async function servidoresArma() {
  const lista = await db.query.servers.findMany({ orderBy: (s, { asc }) => asc(s.ordem) });
  const arma = lista.filter((s) => s.tipo === "Arma 3");
  return arma.length ? arma : lista;
}

export async function servidorSeleccionado(): Promise<Servidor | null> {
  const lista = await servidoresArma();
  if (lista.length === 0) return null;
  const jar = await cookies();
  const id = Number(jar.get(COOKIE_SERVIDOR)?.value);
  return lista.find((s) => s.id === id) ?? lista[0];
}
