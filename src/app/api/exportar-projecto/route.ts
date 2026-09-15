import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const EXCLUIR = new Set([
  "node_modules",
  ".next",
  ".git",
  "out",
  ".turbo",
  ".env",
  ".env.local",
  "tsconfig.tsbuildinfo",
]);

export async function GET() {
  const raiz = process.cwd();
  const zip = new AdmZip();

  function addDir(dir: string, prefix: string) {
    const entradas = fs.readdirSync(dir, { withFileTypes: true });
    for (const entrada of entradas) {
      if (EXCLUIR.has(entrada.name)) continue;
      const caminho = path.join(dir, entrada.name);
      const relativo = prefix ? `${prefix}/${entrada.name}` : entrada.name;
      if (entrada.isDirectory()) {
        addDir(caminho, relativo);
      } else {
        zip.addFile(relativo, fs.readFileSync(caminho));
      }
    }
  }

  addDir(raiz, "");
  const buffer = new Uint8Array(zip.toBuffer());
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="ptr-perscom-projeto-completo.zip"',
      "Content-Length": String(buffer.length),
    },
  });
}
