import { NextResponse, type NextRequest } from "next/server";

const PUBLICOS = [
  "/login",
  "/registo",
  "/alistamento",
  "/api/health",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/exportar-projecto",
  "/manifest.webmanifest",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/patentes") ||
    pathname.startsWith("/medalhas") ||
    pathname.startsWith("/images") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".ico")
  ) {
    return NextResponse.next();
  }
  if (PUBLICOS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }
  const token = req.cookies.get("ptr_sessao")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
