import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PTR PERSCOM - Phoenix Taskforce Rangers",
    short_name: "PTR PERSCOM",
    description: "Sistema de Gestão de Pessoal da Phoenix Taskforce Rangers (Arma 3).",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#060a07",
    theme_color: "#0b130d",
    lang: "pt-PT",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
