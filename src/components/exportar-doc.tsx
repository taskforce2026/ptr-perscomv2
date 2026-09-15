"use client";

import { useState } from "react";
import { toPng } from "html-to-image";

export function ExportarDocumento({ ficheiro }: { ficheiro: string }) {
  const [busy, setBusy] = useState<"pdf" | "png" | null>(null);

  async function png() {
    const el = document.getElementById("documento-oficial");
    if (!el) return;
    setBusy("png");
    try {
      const dataUrl = await toPng(el, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0c140f",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${ficheiro}.png`;
      a.click();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button type="button" className="btn btn-secondary" onClick={() => window.print()} disabled={!!busy}>
        🖨 Imprimir / PDF
      </button>
      <button type="button" className="btn btn-primary" onClick={() => void png()} disabled={!!busy}>
        {busy === "png" ? "A gerar PNG…" : "Exportar PNG"}
      </button>
    </div>
  );
}
