import { PageHeader } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { qrSvg, urlPublicaApp } from "@/lib/qr";

export const dynamic = "force-dynamic";

export default async function InstalarPage() {
  await exigirSessao();
  const base = await urlPublicaApp();
  const urlApp = `${base}/`;
  const [qrAndroid, qrIos, qrPc] = await Promise.all([
    qrSvg(urlApp, 240),
    qrSvg(urlApp, 240),
    qrSvg(urlApp, 240),
  ]);

  return (
    <div>
      <PageHeader
        titulo="Instalar App"
        subtitulo="O mesmo código abre a PTR PERSCOM no Android, iOS e no computador. Lê com a câmara ou digita o endereço."
      />
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 xl:grid-cols-3">
        <QrCard
          titulo="Android"
          icone="🤖"
          subtitulo="Câmara → Chrome → Instalar"
          qr={qrAndroid}
          passos={["Abre a câmara e aponta ao código.", "Toca na notificação e abre no Chrome.", "Menu ⋮ → Instalar aplicação / Adicionar ao ecrã principal."]}
        />
        <QrCard
          titulo="iOS (iPhone / iPad)"
          icone="🍏"
          subtitulo="Câmara → Safari → Ecrã de início"
          qr={qrIos}
          passos={["Abre a câmara e aponta ao código.", "Toca no banner e abre no Safari.", "Botão Partilhar → Adicionar ao ecrã de início."]}
        />
        <QrCard
          titulo="Computador"
          icone="💻"
          subtitulo="Chrome ou Edge · app de ambiente de trabalho"
          qr={qrPc}
          passos={["Abre este endereço no Chrome ou Edge.", "Clica no ícone ⊕ Instalar na barra de endereço.", "A app abre em janela própria, com o emblema PTR."]}
        />
      </div>
      <p className="mt-6 break-all text-center font-mono text-xs text-gold-400">{urlApp}</p>
    </div>
  );
}

function QrCard({
  titulo,
  icone,
  subtitulo,
  qr,
  passos,
}: {
  titulo: string;
  icone: string;
  subtitulo: string;
  qr: string;
  passos: string[];
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-gold-500/35 bg-gradient-to-b from-[#121c15] to-[#070b08] p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-gold-500/15 text-2xl ring-2 ring-gold-500/40">{icone}</span>
        <div>
          <div className="font-[family-name:var(--font-display)] text-xl text-gold-300">{titulo}</div>
          <div className="text-xs text-slate-400">{subtitulo}</div>
        </div>
      </div>
      <div className="relative mx-auto w-[min(100%,260px)]">
        <div className="absolute -left-1 -top-1 h-8 w-8 border-l-2 border-t-2 border-gold-400" />
        <div className="absolute -right-1 -top-1 h-8 w-8 border-r-2 border-t-2 border-gold-400" />
        <div className="absolute -bottom-1 -left-1 h-8 w-8 border-b-2 border-l-2 border-gold-400" />
        <div className="absolute -bottom-1 -right-1 h-8 w-8 border-b-2 border-r-2 border-gold-400" />
        <div className="rounded-xl bg-[#f6e7b2] p-3" dangerouslySetInnerHTML={{ __html: qr }} />
      </div>
      <ol className="mt-6 space-y-2 text-sm text-slate-300">
        {passos.map((p, i) => (
          <li key={i} className="flex gap-2">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold-500/20 text-xs font-bold text-gold-300">
              {i + 1}
            </span>
            <span>{p}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
