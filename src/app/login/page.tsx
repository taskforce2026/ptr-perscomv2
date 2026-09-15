"use client";

import { useState, Suspense, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const sp = useSearchParams();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState(sp.get("erro") ?? "");
  const [busy, setBusy] = useState(false);
  const next = sp.get("next") || "/";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErro("");
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ login, password, next }),
    });
    const j = (await r.json().catch(() => ({}))) as { ok?: boolean; erro?: string; next?: string };
    if (!r.ok || !j.ok) {
      const map: Record<string, string> = {
        credenciais: "Login ou password incorrectos.",
        pendente: "A tua conta ainda está à espera de aprovação do Comando.",
        bloqueada: "Conta bloqueada. Contacta o Comando.",
        campos: "Preenche login e password.",
      };
      setErro(map[j.erro ?? ""] ?? "Não foi possível entrar.");
      setBusy(false);
      return;
    }
    window.location.href = j.next || next;
  }

  return (
    <main className="relative grid min-h-screen place-items-center px-4 py-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/hero-rangers.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-b from-forest-950/40 via-forest-950/80 to-forest-950" />
      <section className="panel relative w-full max-w-md rounded-3xl p-8">
        <div className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/emblema.png" alt="PTR" className="mx-auto h-28 w-28 rounded-full ring-4 ring-gold-500/30" />
          <div className="mt-4 text-xs uppercase tracking-[0.35em] text-gold-500">Arma 3 · Milsim Português</div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-black text-gold-300">PTR PERSCOM</h1>
          <p className="mt-1 text-sm text-slate-400">Phoenix Taskforce Rangers</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-gold-500">Login</span>
            <input className="input" value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-gold-500">Password</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {erro && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{erro}</p>}
          <button className="btn btn-primary w-full" disabled={busy}>
            {busy ? "A entrar…" : "Entrar"}
          </button>
        </form>
        <div className="mt-4 flex justify-center gap-3 text-sm">
          <Link href="/registo" className="text-gold-300 hover:underline">
            Criar conta
          </Link>
          <span className="text-slate-600">·</span>
          <Link href="/alistamento" className="text-gold-300 hover:underline">
            Alistamento
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
