import { and, desc, eq, isNull, or } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { chatMessages, users } from "@/db/schema";
import { eOficial, podeEditar, utilizadorActual } from "@/lib/auth";
import { pushATodos } from "@/lib/push";

export const dynamic = "force-dynamic";

function autorDe(m: { autor: { id: number; nome: string; nomeGuerra: string | null; foto: string | null; rank: { abreviatura: string } | null } }) {
  return {
    id: m.autor.id,
    nome: m.autor.nome,
    nomeGuerra: m.autor.nomeGuerra,
    foto: m.autor.foto,
    rank: m.autor.rank ? { abreviatura: m.autor.rank.abreviatura } : null,
  };
}

export async function GET(req: NextRequest) {
  const u = await utilizadorActual();
  if (!u) return Response.json({ erro: "sessao" }, { status: 401 });
  const canal = req.nextUrl.searchParams.get("canal") ?? "operadores";
  if (canal === "comando" && !eOficial(u)) return Response.json({ erro: "permissao" }, { status: 403 });
  const destino = Number(req.nextUrl.searchParams.get("destino") ?? 0) || null;

  let mensagens;
  if (destino) {
    // Mensagem privada entre mim e o operador seleccionado.
    mensagens = await db.query.chatMessages.findMany({
      where: and(
        eq(chatMessages.canal, canal),
        or(
          and(eq(chatMessages.autorId, u.id), eq(chatMessages.destinoId, destino)),
          and(eq(chatMessages.autorId, destino), eq(chatMessages.destinoId, u.id)),
        ),
      ),
      orderBy: [desc(chatMessages.id)],
      limit: 100,
      with: { autor: { with: { rank: true } } },
    });
  } else {
    mensagens = await db.query.chatMessages.findMany({
      where: and(eq(chatMessages.canal, canal), isNull(chatMessages.destinoId)),
      orderBy: [desc(chatMessages.id)],
      limit: 80,
      with: { autor: { with: { rank: true } } },
    });
  }
  return Response.json({
    mensagens: mensagens.reverse().map((m) => ({
      id: m.id,
      texto: m.texto,
      foto: m.foto,
      criadoEm: m.criadoEm,
      autor: autorDe(m),
    })),
  });
}

export async function POST(req: NextRequest) {
  const u = await utilizadorActual();
  if (!u) return Response.json({ erro: "sessao" }, { status: 401 });
  const body = (await req.json()) as { canal?: string; texto?: string; foto?: string; destinoId?: number };
  const canal = body.canal === "comando" ? "comando" : "operadores";
  if (canal === "comando" && !eOficial(u)) return Response.json({ erro: "permissao" }, { status: 403 });
  const texto = (body.texto ?? "").trim();
  const foto = (body.foto ?? "").trim();
  if (!texto && !foto) return Response.json({ erro: "vazio" }, { status: 400 });
  if (foto && foto.length > 2_500_000) return Response.json({ erro: "Foto demasiado grande (máx. ~3 MB)." }, { status: 400 });
  let destinoId: number | null = null;
  if (body.destinoId && body.destinoId !== u.id) {
    const destino = await db.query.users.findFirst({ where: eq(users.id, body.destinoId) });
    if (!destino) return Response.json({ erro: "destino" }, { status: 400 });
    destinoId = destino.id;
  }
  await db.insert(chatMessages).values({
    canal,
    texto: texto ? texto.slice(0, 2000) : "",
    foto: foto || null,
    destinoId,
    autorId: u.id,
  });
  // Notificação push a quem tem acesso ao canal.
  try {
    const efectivo = await db.query.users.findMany({ with: { rank: true } });
    const ids =
      canal === "comando"
        ? efectivo
            .filter(
              (x) =>
                x.contaEstado === "aprovada" &&
                (x.role === "comando" || x.rank?.categoria === "oficial" || x.rank?.categoria === "general"),
            )
            .map((x) => x.id)
        : efectivo.filter((x) => x.contaEstado === "aprovada").map((x) => x.id);
    await pushATodos(ids, {
      titulo: canal === "comando" ? "PTR · Chat de Comando" : "PTR · Chat de Operadores",
      corpo: `${u.nomeGuerra ?? u.nome}: ${texto || (foto ? "📷 Foto" : "")}`,
      url: `/chat/${canal}`,
    });
  } catch {
    // push é melhor esforço; nunca falha o envio da mensagem
  }
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const u = await utilizadorActual();
  if (!u) return Response.json({ erro: "sessao" }, { status: 401 });
  const id = Number(req.nextUrl.searchParams.get("id"));
  const m = await db.query.chatMessages.findFirst({ where: eq(chatMessages.id, id) });
  if (!m) return Response.json({ erro: "nao_existe" }, { status: 404 });
  const moderador = podeEditar(u) || (m.canal === "comando" && eOficial(u));
  if (m.autorId !== u.id && !moderador) return Response.json({ erro: "permissao" }, { status: 403 });
  await db.delete(chatMessages).where(eq(chatMessages.id, m.id));
  return Response.json({ ok: true });
}
