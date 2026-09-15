"use client";

export function BotaoExportarPdf() {
  return (
    <button type="button" className="btn btn-primary print:hidden" onClick={() => window.print()}>
      Exportar PDF
    </button>
  );
}
