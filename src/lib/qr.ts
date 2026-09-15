import QRCode from "qrcode";
import { headers } from "next/headers";

export async function urlPublicaApp() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = (h.get("x-forwarded-proto") ?? "https").split(",")[0].trim();
  return `${proto}://${host}`;
}

export async function qrSvg(texto: string, size = 220) {
  return QRCode.toString(texto, {
    type: "svg",
    margin: 1,
    width: size,
    color: { dark: "#1a1404", light: "#f6e7b2" },
  });
}
