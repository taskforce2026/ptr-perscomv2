import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO } from "@/lib/auth";

export const dynamic = "force-dynamic";

function urlPublica(req: NextRequest, caminho: string) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  const proto = (req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "")).split(",")[0].trim();
  return new URL(caminho, `${proto}://${host}`);
}

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(urlPublica(req, "/login"), 303);
  res.cookies.set(COOKIE_SESSAO, "", { path: "/", maxAge: 0 });
  return res;
}
export const GET = POST;
