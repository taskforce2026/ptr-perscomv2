import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tabPermissions, userTabPermissions } from "@/db/schema";
import { eComando, type Sessao } from "@/lib/auth";

export const ABAS = [
  { href: "/", label: "Painel", sempre: true },
  { href: "/conta", label: "A minha conta", sempre: true },
  { href: "/pessoal", label: "Pessoal" },
  { href: "/rosters", label: "Rosters" },
  { href: "/eventos", label: "Eventos" },
  { href: "/holograma", label: "Holograma" },
  { href: "/fotos", label: "Fotos" },
  { href: "/chat/operadores", label: "Chat Operadores" },
  { href: "/chat/comando", label: "Chat Comando", soOficial: true },
  { href: "/estatisticas", label: "Estatísticas" },
  { href: "/servidor", label: "Servidor" },
  { href: "/actualizacoes", label: "Actualizações" },
  { href: "/avisos", label: "Avisos" },
  { href: "/candidaturas", label: "Candidaturas", editor: true },
  { href: "/documentos", label: "Documentos" },
  { href: "/formularios", label: "Formulários", editor: true },
  { href: "/admin/patentes", label: "Patentes", editor: true },
  { href: "/admin/cargos", label: "Cargos", editor: true },
  { href: "/admin/especialidades", label: "Especialidades", editor: true },
  { href: "/admin/estados", label: "Estados", editor: true },
  { href: "/admin/unidades", label: "Unidades", editor: true },
  { href: "/admin/rosters", label: "Listas de Roster", editor: true },
  { href: "/admin/condecoracoes", label: "Condecorações", editor: true },
  { href: "/admin/qualificacoes", label: "Qualificações", editor: true },
  { href: "/admin/acessos", label: "Acessos e permissões", soComando: true },
  { href: "/instalar", label: "Instalar App" },
] as const;

export type AbaHref = (typeof ABAS)[number]["href"];

export const ABAS_CONFIGURAVEIS = ABAS.filter((a) => !("sempre" in a && a.sempre) && !("soComando" in a && a.soComando));

export function abaPermitida(path: string, permitidas: string[], u: { role: string; rank?: { categoria: string } | null }) {
  if (eComando(u)) return true;
  if (path === "/sem-permissao") return true;
  const match = permitidas.find((a) => (a === "/" ? path === "/" : path === a || path.startsWith(`${a}/`)));
  if (match) return true;
  if (path.startsWith("/conta")) return true;
  return false;
}

export async function abasDoUtilizador(u: Sessao): Promise<string[]> {
  if (eComando(u)) return ABAS.map((a) => a.href);

  const pessoais = await db.query.userTabPermissions.findMany({
    where: eq(userTabPermissions.userId, u.id),
  });
  if (pessoais.length > 0) {
    const set = new Set(pessoais.filter((p) => p.permitido).map((p) => p.tab));
    set.add("/");
    set.add("/conta");
    if (u.role !== "editor") {
      for (const a of ABAS) {
        if ("editor" in a && a.editor) set.delete(a.href);
      }
    }
    if (!eComando(u) && u.rank?.categoria !== "oficial" && u.rank?.categoria !== "general") {
      set.delete("/chat/comando");
    }
    return [...set];
  }

  const porRole = await db.query.tabPermissions.findMany({
    where: eq(tabPermissions.role, u.role),
  });
  if (porRole.length === 0) {
    return ABAS.filter(
      (a) =>
        !("soComando" in a && a.soComando) &&
        (u.role === "editor" || !("editor" in a && a.editor)) &&
        !("soOficial" in a && a.soOficial && u.rank?.categoria !== "oficial" && u.rank?.categoria !== "general"),
    ).map((a) => a.href);
  }
  const set = new Set(
    porRole.filter((p) => p.permitido).map((p) => p.tab),
  );
  set.add("/");
  set.add("/conta");
  if (!eComando(u) && u.rank?.categoria !== "oficial" && u.rank?.categoria !== "general") {
    set.delete("/chat/comando");
  }
  return [...set];
}

export async function mapaAbasRole(role: string) {
  const rows = await db.query.tabPermissions.findMany({ where: eq(tabPermissions.role, role) });
  return Object.fromEntries(rows.map((r) => [r.tab, r.permitido]));
}

export async function mapaAbasUser(userId: number) {
  const rows = await db.query.userTabPermissions.findMany({ where: eq(userTabPermissions.userId, userId) });
  return Object.fromEntries(rows.map((r) => [r.tab, r.permitido]));
}


