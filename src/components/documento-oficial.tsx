export function DocumentoOficial({
  titulo,
  tipo,
  numero,
  corpo,
  destinatario,
  emitidoPor,
  data,
}: {
  titulo: string;
  tipo: string;
  numero: string;
  corpo: string;
  destinatario: string;
  emitidoPor?: string | null;
  data: string;
}) {
  return (
    <article
      id="documento-oficial"
      className="doc-militar relative mx-auto max-w-[210mm] overflow-hidden rounded-sm border-[3px] border-[#c9a227] bg-[#f4ecd4] text-[#1a1408] shadow-2xl"
    >
      <div className="bg-[#3a0c0c] px-4 py-1 text-center text-[10px] font-black uppercase tracking-[0.4em] text-[#f5d0d0]">
        ★ Confidencial · Phoenix Taskforce Rangers · Confidencial ★
      </div>
      <div className="px-7 py-6">
        <header className="flex items-center gap-4 border-b-2 border-[#c9a227] pb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/emblema.png" alt="PTR" className="h-[72px] w-[72px] rounded-full ring-2 ring-[#c9a227]" />
          <div>
            <div className="font-[family-name:var(--font-display)] text-xl font-black leading-tight tracking-wide text-[#1a1408]">
              PHOENIX TASKFORCE
              <br />
              RANGERS
            </div>
            <div className="text-xs tracking-wide text-[#6b5a2a]">Comando de Pessoal · PERSCOM</div>
          </div>
        </header>
        <div className="mt-3 text-[11px] uppercase tracking-[0.2em] text-[#7a651f]">
          {tipo} · {numero} · {data} · {destinatario}
        </div>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-lg font-bold uppercase tracking-wide">{titulo}</h1>
        <div className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed">{corpo}</div>
        <footer className="mt-8 grid gap-6 md:grid-cols-2">
          <div>
            <div className="h-10 border-b border-[#c9a227]/60" />
            <div className="mt-1 text-[11px] uppercase tracking-wider text-[#6b5a2a]">O militar</div>
          </div>
          <div className="text-right">
            <div className="h-10 border-b border-[#c9a227]/60" />
            <div className="mt-1 text-[11px] uppercase tracking-wider text-[#6b5a2a]">
              {emitidoPor ?? "O Comandante da Taskforce"}
            </div>
          </div>
        </footer>
      </div>
      <div className="bg-[#3a0c0c] px-4 py-1 text-center text-[10px] font-black uppercase tracking-[0.35em] text-[#f5d0d0]">
        Confidencial · Logótipo PTR · Reprodução não autorizada
      </div>
    </article>
  );
}
