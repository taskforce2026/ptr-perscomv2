import { vapidKeys } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function GET() {
  const k = await vapidKeys();
  return Response.json({ chave: k.chavePublica });
}
