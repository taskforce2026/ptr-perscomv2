import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, type Role } from "@/db/schema";

export const COOKIE_SESSAO = "ptr_sessao";
const SECRET = process.env.AUTH_SECRET ?? "ptr-perscom-phoenix-rangers-2026";

export type Sessao = {
  id: number;
  nome: string;
  nomeGuerra: string | null;
  login: string | null;
  role: Role;
  foto: string | null;
  rank: { id: number; nome: string; abreviatura: string; imagem: string | null; categoria: string; ordem: number } | null;
  unit: { id: number; nome: string } | null;
  position: { id: number; nome: string } | null;
  status: { id: number; nome: string; cor: string } | null;
};

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verificarPassword(password: string, stored: string | null) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const hashed = scryptSync(password, salt, 64);
  const buf = Buffer.from(hash, "hex");
  if (buf.length !== hashed.length) return false;
  return timingSafeEqual(buf, hashed);
}

export function criarToken(userId: number) {
  const payload = Buffer.from(JSON.stringify({ id: userId, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })).toString(
    "base64url",
  );
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function lerToken(token?: string | null): number | null {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const expected = createHmac("sha256", SECRET).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { id: number; exp: number };
    if (Date.now() > data.exp) return null;
    return data.id;
  } catch {
    return null;
  }
}

export async function utilizadorActual(): Promise<Sessao | null> {
  const jar = await cookies();
  const id = lerToken(jar.get(COOKIE_SESSAO)?.value);
  if (!id) return null;
  const u = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: { rank: true, unit: true, position: true, status: true },
  });
  if (!u || u.contaEstado !== "aprovada") return null;
  return {
    id: u.id,
    nome: u.nome,
    nomeGuerra: u.nomeGuerra,
    login: u.login,
    role: (u.role as Role) ?? "operador",
    foto: u.foto,
    rank: u.rank,
    unit: u.unit,
    position: u.position,
    status: u.status,
  };
}

export async function exigirSessao(): Promise<Sessao> {
  const u = await utilizadorActual();
  if (!u) redirect("/login");
  return u;
}

export function eComando(u: { role: string }) {
  return u.role === "comando";
}

export function podeEditar(u: { role: string }) {
  return u.role === "comando" || u.role === "editor";
}

export function eOficial(u: { role: string; rank?: { categoria: string } | null }) {
  return eComando(u) || u.rank?.categoria === "oficial" || u.rank?.categoria === "general";
}

export async function exigirComando() {
  const u = await exigirSessao();
  if (!eComando(u)) redirect("/sem-permissao");
  return u;
}

export async function exigirEdicao() {
  const u = await exigirSessao();
  if (!podeEditar(u)) redirect("/sem-permissao");
  return u;
}

export async function exigirChatComando() {
  const u = await exigirSessao();
  if (!eOficial(u)) redirect("/sem-permissao");
  return u;
}
