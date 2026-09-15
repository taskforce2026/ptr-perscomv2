import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { ranks, units, users } from "@/db/schema";
import { ilike } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function registar(formData: FormData) {
  "use server";
  const login = String(formData.get("login") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  if (!login || !nome || password.length < 6) redirect("/registo?erro=campos");
  const existe = await db.query.users.findFirst({ where: ilike(users.login, login) });
  if (existe) redirect("/registo?erro=existe");
  await db.insert(users).values({
    nome,
    nomeGuerra: String(formData.get("nomeGuerra") ?? "").trim() || null,
    discord: String(formData.get("discord") ?? "").trim() || null,
    login,
    passwordHash: hashPassword(password),
    role: "operador",
    contaEstado: "pendente",
    rankId: Number(formData.get("rankId")) || null,
    unitId: Number(formData.get("unitId")) || null,
    registoNotas: String(formData.get("notas") ?? "").trim() || null,
  });
  redirect("/registo?ok=1");
}

export default async function RegistoPage({ searchParams }: { searchParams: Promise<{ erro?: string; ok?: string }> }) {
  const { erro, ok } = await searchParams;
  const [patentes, unidades] = await Promise.all([
    db.select().from(ranks),
    db.select().from(units),
  ]);
  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-10">
      <div className="mb-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/emblema.png" alt="" className="mx-auto h-20 w-20 rounded-full" />
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl text-gold-300">Registo de efectivo</h1>
        <p className="text-sm text-slate-400">Ficas pendente até o Comando aprovar o acesso.</p>
      </div>
      {ok && (
        <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          Pedido enviado. Aguarda aprovação em Acessos e permissões.
        </p>
      )}
      {erro && (
        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {erro === "existe" ? "Esse login já existe." : "Preenche os campos obrigatórios (password ≥ 6)."}
        </p>
      )}
      <form action={registar} className="panel space-y-3 rounded-2xl p-5">
        <input name="nome" className="input" placeholder="Nome completo" required />
        <input name="nomeGuerra" className="input" placeholder="Nome de guerra" />
        <input name="login" className="input" placeholder="Login" required />
        <input name="password" type="password" className="input" placeholder="Password" required />
        <input name="discord" className="input" placeholder="Discord" />
        <select name="rankId" className="input">
          <option value="">Patente (opcional)</option>
          {patentes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.abreviatura} — {p.nome}
            </option>
          ))}
        </select>
        <select name="unitId" className="input">
          <option value="">Unidade (opcional)</option>
          {unidades.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nome}
            </option>
          ))}
        </select>
        <textarea name="notas" className="input min-h-24" placeholder="Notas para o Comando" />
        <button className="btn btn-primary w-full">Pedir acesso</button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-gold-300 hover:underline">
          Voltar ao login
        </Link>
      </p>
    </main>
  );
}
