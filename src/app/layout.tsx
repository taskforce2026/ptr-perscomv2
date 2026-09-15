import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Cinzel, Rajdhani } from "next/font/google";
import "./globals.css";
import { ensureSeed } from "@/db/seed";

const display = Cinzel({ subsets: ["latin"], variable: "--font-display", weight: ["500", "700", "900"] });
const sans = Rajdhani({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "PTR PERSCOM · Phoenix Taskforce Rangers",
  description: "Sistema de Gestão de Pessoal da Phoenix Taskforce Rangers (Arma 3 · Milsim Português).",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b130d",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: ReactNode }) {
  await ensureSeed();
  return (
    <html lang="pt">
      <body className={`${display.variable} ${sans.variable} antialiased`}>{children}</body>
    </html>
  );
}
