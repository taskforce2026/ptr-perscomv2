import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { PageHeader, Panel, Campo, StatusBadge } from "@/components/ui";
import { Insignia } from "@/components/insignia";
import { exigirEdicao } from "@/lib/auth";
import { apagarCatalogo, guardarCatalogo } from "@/lib/actions";

export const dynamic = "force-dynamic";

type Item = {
  id: number;
  nome: string;
  extra?: string | null;
  ordem: number;
  categoria?: string;
  imagem?: string | null;
  descricao?: string | null;
};

const CATALOGOS: Record<
  string,
  {
    titulo: string;
    subtitulo: string;
    extra?: string;
    categoria?: boolean;
    roster?: boolean;
    imagem?: boolean;
    cor?: boolean;
    descricao?: boolean;
    list: () => Promise<Item[]>;
  }
> = {
  patentes: {
    titulo: "Patentes",
    subtitulo: "Hierarquia e insígnias do Exército Português usadas no PERSCOM.",
    extra: "Abreviatura",
    categoria: true,
    imagem: true,
    list: async () =>
      (await db.query.ranks.findMany({ orderBy: (r, { asc }) => asc(r.ordem) })).map((r) => ({
        id: r.id,
        nome: r.nome,
        extra: r.abreviatura,
        ordem: r.ordem,
        categoria: r.categoria,
        imagem: r.imagem,
      })),
  },
  cargos: {
    titulo: "Cargos",
    subtitulo: "Funções/posições que os militares podem ocupar.",
    list: async () =>
      (await db.query.positions.findMany({ orderBy: (r, { asc }) => asc(r.ordem) })).map((r) => ({
        id: r.id,
        nome: r.nome,
        ordem: r.ordem,
      })),
  },
  especialidades: {
    titulo: "Especialidades",
    subtitulo: "Ramos e especialidades técnicas da unidade.",
    extra: "Abreviatura",
    list: async () =>
      (await db.query.specialties.findMany({ orderBy: (r, { asc }) => asc(r.ordem) })).map((r) => ({
        id: r.id,
        nome: r.nome,
        extra: r.abreviatura,
        ordem: r.ordem,
      })),
  },
  estados: {
    titulo: "Estados",
    subtitulo: "Estados de serviço (Activo, Licença, Reserva…).",
    extra: "Cor",
    cor: true,
    list: async () =>
      (await db.query.statuses.findMany({ orderBy: (r, { asc }) => asc(r.ordem) })).map((r) => ({
        id: r.id,
        nome: r.nome,
        extra: r.cor,
        ordem: r.ordem,
      })),
  },
  unidades: {
    titulo: "Unidades",
    subtitulo: "Unidades apresentadas na ordem de batalha.",
    extra: "Abreviatura",
    roster: true,
    descricao: true,
    list: async () =>
      (await db.query.units.findMany({ orderBy: (r, { asc }) => asc(r.ordem) })).map((r) => ({
        id: r.id,
        nome: r.nome,
        extra: r.abreviatura,
        descricao: r.descricao,
        ordem: r.ordem,
      })),
  },
  rosters: {
    titulo: "Listas de Roster",
    subtitulo: "Agrupamentos de unidades apresentados na página de Rosters.",
    extra: "Descrição",
    list: async () =>
      (await db.query.rosters.findMany({ orderBy: (r, { asc }) => asc(r.ordem) })).map((r) => ({
        id: r.id,
        nome: r.nome,
        extra: r.descricao,
        ordem: r.ordem,
      })),
  },
  condecoracoes: {
    titulo: "Condecorações",
    subtitulo: "Medalhas e distintivos da PTR, com designação oficial.",
    extra: "Designação",
    imagem: true,
    list: async () =>
      (await db.query.awards.findMany({ orderBy: (r, { asc }) => asc(r.ordem) })).map((r) => ({
        id: r.id,
        nome: r.nome,
        extra: r.designacao ?? r.descricao,
        imagem: r.imagem,
        ordem: r.ordem,
        descricao: r.descricao,
      })),
  },
  qualificacoes: {
    titulo: "Qualificações",
    subtitulo: "Cursos e qualificações da unidade.",
    extra: "Abreviatura",
    list: async () =>
      (await db.query.qualifications.findMany({ orderBy: (r, { asc }) => asc(r.ordem) })).map((r) => ({
        id: r.id,
        nome: r.nome,
        extra: r.abreviatura,
        ordem: r.ordem,
      })),
  },
};

export default async function CatalogoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ editar?: string }>;
}) {
  await exigirEdicao();
  const { slug } = await params;
  const { editar } = await searchParams;
  const cat = CATALOGOS[slug];
  if (!cat) notFound();
  const lista = await cat.list();
  const editando = editar ? lista.find((i) => String(i.id) === editar) : undefined;
  const rosters = cat.roster ? await db.query.rosters.findMany() : [];

  return (
    <div>
      <PageHeader titulo={cat.titulo} subtitulo={cat.subtitulo} />
      <Panel className="mb-4 !p-0">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              {cat.imagem && <th></th>}
              <th>Nome</th>
              {cat.extra && <th>{cat.extra}</th>}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((item) => (
              <tr key={item.id} className={editando?.id === item.id ? "bg-gold-500/5" : ""}>
                <td className="text-slate-500">{item.ordem}</td>
                {cat.imagem && (
                  <td>
                    <Insignia
                      rank={item.imagem ? { nome: item.nome, abreviatura: item.extra ?? "", imagem: item.imagem } : null}
                      size={36}
                    />
                  </td>
                )}
                <td className="font-medium">{item.nome}</td>
                {cat.extra && (
                  <td>
                    {cat.cor && item.extra ? (
                      <StatusBadge nome={item.nome} cor={item.extra} />
                    ) : (
                      <span className="text-slate-400">{item.extra}</span>
                    )}
                  </td>
                )}
                <td className="text-right whitespace-nowrap">
                  <Link href={`/admin/${slug}?editar=${item.id}`} className="btn btn-ghost !px-2 !py-1 text-xs">
                    Editar
                  </Link>
                  <form action={apagarCatalogo} className="inline">
                    <input type="hidden" name="tipo" value={slug} />
                    <input type="hidden" name="id" value={item.id} />
                    <button className="btn btn-danger !px-2 !py-1 text-xs">Apagar</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel titulo={editando ? `Editar ${editando.nome}` : `Novo ${cat.titulo.replace(/s$/, "").toLowerCase()}`}>
        <form action={guardarCatalogo} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="tipo" value={slug} />
          {editando && <input type="hidden" name="id" value={editando.id} />}
          <Campo label="Nome *">
            <input name="nome" className="input" required defaultValue={editando?.nome ?? ""} />
          </Campo>
          {cat.extra && !cat.cor && slug === "condecoracoes" && (
            <Campo label="Designação oficial">
              <input name="designacao" className="input" defaultValue={editando?.extra ?? ""} placeholder="Medalha de Ouro de Serviços Distintos" />
            </Campo>
          )}
          {cat.extra && !cat.cor && slug !== "condecoracoes" && (
            <Campo label={cat.extra}>
              <input name="extra" className="input" defaultValue={editando?.extra ?? ""} />
            </Campo>
          )}
          {slug === "condecoracoes" && (
            <Campo label="Descrição">
              <input name="extra" className="input" defaultValue={editando?.descricao ?? ""} />
            </Campo>
          )}
          {cat.cor && (
            <Campo label="Cor *">
              <div className="flex items-center gap-3">
                <input name="extra" type="color" defaultValue={editando?.extra ?? "#22c55e"} className="h-10 w-14 cursor-pointer rounded border border-gold-500/20 bg-transparent" />
                <span className="text-xs text-slate-500">Escolhe a cor do estado</span>
              </div>
            </Campo>
          )}
          {cat.imagem && (
            <Campo label="Insígnia (caminho)">
              <input name="imagem" className="input" defaultValue={editando?.imagem ?? ""} placeholder="/patentes/Cap.svg" />
            </Campo>
          )}
          {cat.categoria && (
            <Campo label="Categoria">
              <select name="categoria" className="input" defaultValue={editando?.categoria ?? "praca"}>
                <option value="praca">Praça</option>
                <option value="sargento">Sargento</option>
                <option value="oficial">Oficial</option>
                <option value="general">General</option>
              </select>
            </Campo>
          )}
          {cat.roster && (
            <Campo label="Roster">
              <select name="rosterId" className="input">
                <option value="">—</option>
                {rosters.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nome}
                  </option>
                ))}
              </select>
            </Campo>
          )}
          {cat.descricao && (
            <div className="md:col-span-2">
              <Campo label="Descrição">
                <textarea name="descricao" className="input min-h-20" defaultValue={editando?.descricao ?? ""} />
              </Campo>
            </div>
          )}
          <Campo label="Ordem">
            <input name="ordem" type="number" defaultValue={editando?.ordem ?? lista.length + 1} className="input" />
          </Campo>
          <div className="flex items-end justify-end gap-2 md:col-span-2">
            {editando && (
              <Link href={`/admin/${slug}`} className="btn btn-ghost">
                Cancelar
              </Link>
            )}
            <button className="btn btn-primary">{editando ? "Guardar" : "Adicionar"}</button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
