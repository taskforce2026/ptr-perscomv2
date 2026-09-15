import webpush from "web-push";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { appSettings, pushSubscriptions } from "@/db/schema";
import { garantirEsquema } from "@/db/migrar";

type Chaves = { chavePublica: string; chavePrivada: string };
let cache: Chaves | null = null;

/** Chaves VAPID: usa env se existirem, senão gera uma vez e guarda em BD. */
export async function vapidKeys(): Promise<Chaves> {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return { chavePublica: process.env.VAPID_PUBLIC_KEY, chavePrivada: process.env.VAPID_PRIVATE_KEY };
  }
  if (cache) return cache;
  await garantirEsquema();
  const row = await db.query.appSettings.findFirst({ where: (t, { eq }) => eq(t.chave, "vapid") });
  if (row?.valor) {
    const [pub, priv] = JSON.parse(row.valor) as [string, string];
    cache = { chavePublica: pub, chavePrivada: priv };
    return cache;
  }
  const geradas = webpush.generateVAPIDKeys();
  cache = { chavePublica: geradas.publicKey, chavePrivada: geradas.privateKey };
  try {
    await db.insert(appSettings).values({
      chave: "vapid",
      valor: JSON.stringify([geradas.publicKey, geradas.privateKey]),
    });
  } catch {
    // outra request já guardou
  }
  return cache;
}

export async function inscreverPush(userId: number, sub: PushSubscriptionJSON) {
  if (!sub.endpoint) return;
  const p256dh = sub.keys?.p256dh !== undefined ? sub.keys.p256dh : "";
  const auth = sub.keys?.auth !== undefined ? sub.keys.auth : "";
  const endpoint = sub.endpoint;
  // Uma subscrição activa por utilizador — evita notificações duplicadas.
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  await db.insert(pushSubscriptions).values({
    userId: userId,
    endpoint: endpoint,
    p256dh: p256dh,
    auth: auth,
  });
}

type Payload = { titulo: string; corpo: string; url?: string };

async function enviarSub(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: Payload,
  k: Chaves,
) {
  webpush.setVapidDetails("mailto:ptr@phoenix-rangers.app", k.chavePublica, k.chavePrivada);
  await webpush.sendNotification(
    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    JSON.stringify(payload),
    { TTL: 60 },
  );
}

/** Notifica todos os utilizadores indicados que têm subscrição (falhas são ignoradas). */
export async function pushATodos(userIds: number[], payload: Payload) {
  if (userIds.length === 0) return;
  await garantirEsquema();
  const todas = await db.query.pushSubscriptions.findMany({
    where: (t, { inArray: ia }) => ia(t.userId, userIds),
  });
  // Segurança extra: mantém apenas a subscrição mais recente de cada utilizador.
  const porUsuario = new Map<number, (typeof todas)[number]>();
  for (const s of todas) {
    const atual = porUsuario.get(s.userId);
    if (!atual || s.id > atual.id) porUsuario.set(s.userId, s);
  }
  const subs = [...porUsuario.values()];
  const k = await vapidKeys();
  await Promise.allSettled(subs.map((s) => enviarSub(s, payload, k).catch(() => null)));
}
