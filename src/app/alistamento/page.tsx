import Link from "next/link";
import { candidatar } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function AlistamentoPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const { ok, erro } = await searchParams;
  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-10">
      <div className="mb-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/emblema.png" alt="" className="mx-auto h-24 w-24 rounded-full ring-2 ring-gold-500/30" />
        <div className="mt-3 text-xs uppercase tracking-[0.3em] text-gold-500">Phoenix Taskforce Rangers</div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-gold-300">Alistamento</h1>
        <p className="mt-2 text-sm text-slate-400">Candidatura pública para integrar o efectivo da PTR.</p>
      </div>
      {ok && (
        <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          Candidatura recebida. O Comando entra em contacto via Discord.
        </p>
      )}
      {erro && <p className="mb-4 text-sm text-red-300">Indica o teu nome.</p>}
      <form action={candidatar} className="panel space-y-3 rounded-2xl p-5">
        <input name="nome" className="input" placeholder="Nome completo" required />
        <input name="nomeGuerra" className="input" placeholder="Nome de guerra pretendido" />
        <input name="discord" className="input" placeholder="Discord" />
        <input name="idade" className="input" placeholder="Idade" />
        <textarea name="experiencia" className="input min-h-20" placeholder="Experiência em Arma 3 / milsim" />
        <textarea name="motivacao" className="input min-h-24" placeholder="Porque queres juntar-te à PTR?" />
        <button className="btn btn-primary w-full">Enviar candidatura</button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-gold-300 hover:underline">
          Já tens conta? Entrar
        </Link>
      </p>
    </main>
  );
}
