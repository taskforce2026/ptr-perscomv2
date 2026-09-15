import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or, ilike } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { verificarPassword, criarToken, COOKIE_SESSAO } from "@/lib/auth";
import { ensureSeed } from "@/db/seed";

export const dynamic = "force-dynamic";

function urlPublica(req: NextRequest, caminho: string) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  const proto = (req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "")).split(",")[0].trim();
  return new URL(caminho, `${proto}://${host}`);
}

const DURACAO = 30 * 24 * 60 * 60;

function httpsDoPedido(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto");
  if (proto) return proto.split(",")[0].trim() === "https";
  return req.nextUrl.protocol === "https:";
}

async function lerCredenciais(req: NextRequest): Promise<{ login: string; password: string; next: string }> {
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const b = (await req.json()) as Record<string, string>;
    return { login: (b.login ?? "").trim(), password: b.password ?? "", next: b.next ?? "/" };
  }
  const fd = await req.formData();
  const g = (k: string) => (typeof fd.get(k) === "string" ? (fd.get(k) as string) : "");
  return { login: g("login").trim(), password: g("password"), next: g("next") || "/" };
}

export async function POST(req: NextRequest) {
  await ensureSeed();
  const { login, password, next } = await lerCredenciais(req);
  const querJson = (req.headers.get("accept") ?? "").includes("application/json");
  const destinoSeguro = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const falhar = (erro: string, status = 401) =>
    querJson
      ? NextResponse.json({ ok: false, erro }, { status })
      : NextResponse.redirect(urlPublica(req, `/login?erro=${erro}&next=${encodeURIComponent(destinoSeguro)}`), 303);

  if (!login || !password) return falhar("campos", 400);
  const u = await db.query.users.findFirst({ where: or(ilike(users.login, login), ilike(users.numeroServico, login)) });
  if (!u || !verificarPassword(password, u.passwordHash)) return falhar("credenciais");
  if (u.contaEstado === "pendente") return falhar("pendente", 403);
  if (u.contaEstado === "bloqueada") return falhar("bloqueada", 403);

  await db.update(users).set({ ultimoLogin: new Date() }).where(eq(users.id, u.id));
  const token = criarToken(u.id);
  const https = httpsDoPedido(req);
  const res = querJson
    ? NextResponse.json({ ok: true, next: destinoSeguro, token })
    : NextResponse.redirect(urlPublica(req, destinoSeguro), 303);
  res.cookies.set(COOKIE_SESSAO, token, {
    httpOnly: true,
    sameSite: https ? "none" : "lax",
    secure: https,
    path: "/",
    maxAge: DURACAO,
  });
  return res;
}
