import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLog, serverStatus, servers, users } from "@/db/schema";

export type EstadoServidor = {
  serverId: number;
  online: boolean;
  jogadores: string[];
  operadores: { id: number; nome: string; nomeGuerra: string | null }[];
  actualizadoEm: Date;
};

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

async function pingServidor(endereco: string, timeoutMs = 3000): Promise<{ online: boolean; jogadores: string[] }> {
  const url = `http://${endereco}:2306/serverInfo`;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const r = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(t);
    if (!r.ok) return { online: false, jogadores: [] };
    const json = (await r.json()) as { online?: boolean; playerlist?: { name?: string }[] };
    return {
      online: !!json.online,
      jogadores: (json.playerlist ?? []).map((p) => p.name ?? "").filter(Boolean),
    };
  } catch {
    return { online: false, jogadores: [] };
  }
}

let emCorre: Promise<void> | null = null;

/**
 * Liga a cada servidor Arma 3 (API REST :2306), guarda o estado em BD e
 * cruza os nomes de guerra dos jogadores com os operadores do PERSCOM.
 * Throttle: só volta a ligar 60 s após a última verificação.
 */
export async function verificarServidores(): Promise<void> {
  if (emCorre) return emCorre;
  emCorre = (async () => {
    const arma = await db.query.servers.findMany({
      where: eq(servers.tipo, "Arma 3"),
      orderBy: (s, { asc }) => asc(s.ordem),
    });
    const efectivo = await db.query.users.findMany({ with: { rank: true } });
    const nomesEfectivo = efectivo.map((u) => ({
      id: u.id,
      nome: u.nome,
      nomeGuerra: u.nomeGuerra,
      chaves: (u.nomeGuerra ? [u.nome, u.nomeGuerra] : [u.nome]).map(norm),
    }));

    for (const srv of arma) {
      if (!srv.endereco) continue;
      const antes = await db.query.serverStatus.findFirst({ where: eq(serverStatus.serverId, srv.id) });
      const ha60s =
        antes && antes.actualizadoEm && Date.now() - antes.actualizadoEm.getTime() < 60_000;
      if (ha60s) continue;

      const { online, jogadores } = await pingServidor(srv.endereco);
      const setJog = new Set(jogadores.map(norm));
      const operadores = nomesEfectivo.filter((u) => u.chaves.some((c) => setJog.has(c)));
      const antesIds = antes?.operadores ? (JSON.parse(antes.operadores) as number[]) : [];
      const novos = operadores.filter((o) => !antesIds.includes(o.id));
      for (const o of novos) {
        await db.insert(auditLog).values({
          actor: "Monitor de servidores",
          accao: "Operador ligado",
          detalhe: `${o.nomeGuerra ?? o.nome} entrou em ${srv.nome} (${srv.endereco}).`,
        });
      }
      const row = {
        serverId: srv.id,
        online,
        jogadores: JSON.stringify(jogadores),
        operadores: JSON.stringify(operadores.map((o) => o.id)),
        actualizadoEm: new Date(),
      };
      if (antes) await db.update(serverStatus).set(row).where(eq(serverStatus.serverId, srv.id));
      else await db.insert(serverStatus).values(row);
    }
  })().finally(() => {
    emCorre = null;
  });
  return emCorre;
}

export async function estadosServidores(): Promise<EstadoServidor[]> {
  await verificarServidores();
  const rows = await db.query.serverStatus.findMany();
  const todos = await db.query.users.findMany();
  const porId = new Map(todos.map((u) => [u.id, u]));
  return rows.map((r) => {
    const opIds = r.operadores ? (JSON.parse(r.operadores) as number[]) : [];
    return {
      serverId: r.serverId,
      online: r.online,
      jogadores: r.jogadores ? (JSON.parse(r.jogadores) as string[]) : [],
      operadores: opIds
        .map((id) => porId.get(id))
        .filter(Boolean)
        .map((u) => ({ id: u!.id, nome: u!.nome, nomeGuerra: u!.nomeGuerra })),
      actualizadoEm: r.actualizadoEm,
    };
  });
}
