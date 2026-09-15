import { db } from "@/db";
import { desc } from "drizzle-orm";
import { photos } from "@/db/schema";
import { exigirSessao, podeEditar } from "@/lib/auth";
import { PageHeader, Panel, Campo, Vazio } from "@/components/ui";
import { publicarFoto, apagarFoto } from "@/lib/actions";
import { fmtDataHora } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FotosPage({ searchParams }: { searchParams: Promise<{ erro?: string; album?: string }> }) {
  const sessao = await exigirSessao();
  const admin = podeEditar(sessao);
  const { erro, album } = await searchParams;
  const lista = await db.query.photos.findMany({
    orderBy: [desc(photos.criadoEm)],
    with: { autor: { with: { rank: true } } },
  });
  const albuns = Array.from(new Set(lista.map((p) => p.album)));
  const visiveis = album ? lista.filter((p) => p.album === album) : lista;

  return (
    <div>
      <PageHeader
        titulo="Fotos da unidade"
        subtitulo="Feed da PTR. Podes apagar as tuas publicações. O Comando pode apagar qualquer uma."
      />
      {erro && <p className="mb-3 text-sm text-red-300">Indica título e URL da imagem.</p>}
      <div className="mb-4 flex flex-wrap gap-2">
        <a href="/fotos" className={`btn ${!album ? "btn-primary" : "btn-ghost"} !py-1.5 text-xs`}>
          Todas
        </a>
        {albuns.map((a) => (
          <a key={a} href={`/fotos?album=${encodeURIComponent(a)}`} className={`btn ${album === a ? "btn-primary" : "btn-ghost"} !py-1.5 text-xs`}>
            {a}
          </a>
        ))}
      </div>
      {visiveis.length === 0 ? (
        <Vazio texto="Ainda não há fotos neste álbum." />
      ) : (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visiveis.map((p) => {
            const podeApagar = admin || p.autorId === sessao.id;
            return (
              <figure key={p.id} className="panel overflow-hidden rounded-2xl p-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.titulo} className="h-52 w-full object-cover" />
                <figcaption className="p-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-gold-500">{p.album}</div>
                  <div className="font-bold text-gold-200">{p.titulo}</div>
                  {p.descricao && <p className="text-sm text-slate-400">{p.descricao}</p>}
                  <p className="mt-1 text-[11px] text-slate-500">
                    {p.autor?.nomeGuerra ?? p.autor?.nome ?? "PTR"} · {fmtDataHora(p.criadoEm)}
                  </p>
                  {podeApagar && (
                    <form action={apagarFoto} className="mt-2">
                      <input type="hidden" name="id" value={p.id} />
                      <button className="btn btn-danger !py-1 text-xs">Apagar publicação</button>
                    </form>
                  )}
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}
      <Panel titulo="Publicar foto">
        <form action={publicarFoto} className="grid gap-3 md:grid-cols-2">
          <Campo label="Título">
            <input name="titulo" className="input" required />
          </Campo>
          <Campo label="Álbum">
            <input name="album" className="input" defaultValue="Geral" />
          </Campo>
          <div className="md:col-span-2">
            <Campo label="URL da imagem">
              <input name="url" className="input" placeholder="https://…" required />
            </Campo>
          </div>
          <div className="md:col-span-2">
            <Campo label="Descrição">
              <textarea name="descricao" className="input min-h-20" />
            </Campo>
          </div>
          <button className="btn btn-primary">Publicar</button>
        </form>
      </Panel>
    </div>
  );
}
