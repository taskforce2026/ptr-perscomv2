import { utilizadorActual } from "@/lib/auth";
import { inscreverPush } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const u = await utilizadorActual();
  if (!u) return Response.json({ ok: false, erro: "sessao" }, { status: 401 });
  const sub = (await req.json()) as PushSubscriptionJSON;
  if (!sub?.endpoint) return Response.json({ ok: false, erro: "sub" }, { status: 400 });
  await inscreverPush(u.id, sub);
  return Response.json({ ok: true });
}
