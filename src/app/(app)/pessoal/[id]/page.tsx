import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { userDocuments, users } from "@/db/schema";
import { PageHeader, Panel, StatusBadge, Tag, SoEditores, Campo, Vazio } from "@/components/ui";
import { Insignia, Medalha } from "@/components/insignia";
import { fmtData, nomeCompleto } from "@/lib/format";
import { exigirSessao, podeEditar } from "@/lib/auth";
import {
  actualizarMilitar,
  apagarOperador,
  atribuirCondecoracao,
  gerarCertificadoRapido,
  removerCondecoracao,
} from "@/lib/actions";

export const dynamic = "force-dynamic";

const TABS = [
  { k: "resumo", l: "Resumo" },
  { k: "colocacoes", l: "Colocações" },
  { k: "promocoes", l: "Promoções" },
  { k: "condecoracoes", l: "Condecorações" },
  { k: "qualificacoes", l: "Qualificações" },
  { k: "combate", l: "Combate" },
  { k: "eventos", l: "Eventos" },
  { k: "documentos", l: "Documentos" },
  { k: "acesso", l: "Acesso" },
] as const;

export default async function PerfilPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const sessao = await exigirSessao();
  const { id } = await params;
  const { tab } = await searchParams;
  const activa = TABS.some((t) => t.k === tab) ? (tab as (typeof TABS)[number]["k"]) : "resumo";
  const u = await db.query.users.findFirst({
    where: eq(users.id, Number(id)),
    with: {
      rank: true,
      position: true,
      specialty: true,
      status: true,
      unit: true,
      promotions: { with: { rank: true } },
      awards: { with: { award: true } },
      qualifications: { with: { qualification: true } },
      combatRecords: true,
      attendance: { with: { event: true } },
    },
  });
  if (!u) notFound();

  const [patentes, cargos, specs, estados, unidades, docsGerados, medalhas] = await Promise.all([
    db.query.ranks.findMany({ orderBy: (r, { asc }) => asc(r.ordem) }),
    db.query.positions.findMany({ orderBy: (r, { asc }) => asc(r.ordem) }),
    db.query.specialties.findMany({ orderBy: (r, { asc }) => asc(r.ordem) }),
    db.query.statuses.findMany({ orderBy: (r, { asc }) => asc(r.ordem) }),
    db.query.units.findMany({ orderBy: (r, { asc }) => asc(r.ordem) }),
    db.query.userDocuments.findMany({
      where: eq(userDocuments.userId, u.id),
      orderBy: [desc(userDocuments.criadoEm)],
      with: { document: true },
    }),
    db.query.awards.findMany({ orderBy: (r, { asc }) => asc(r.ordem) }),
  ]);

  const admin = podeEditar(sessao);

  return (
    <div>
      <div className="panel mb-4 flex flex-col gap-4 rounded-2xl p-5 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Insignia rank={u.rank} size={64} />
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-gold-500">
              {u.rank?.nome} {u.rank?.abreviatura && `· ${u.rank.abreviatura}`}
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl text-gold-300">{nomeCompleto(u)}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              {u.status && <StatusBadge nome={u.status.nome} cor={u.status.cor} />}
              {u.unit && <Tag>{u.unit.nome}</Tag>}
              {u.position && <Tag tone="slate">{u.position.nome}</Tag>}
              {u.specialty && <Tag tone="green">+ {u.specialty.abreviatura}</Tag>}
              {u.numeroServico && <Tag tone="slate">{u.numeroServico}</Tag>}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {u.awards.slice(0, 6).map((a) => (a.award ? <Medalha key={a.id} award={a.award} size={22} mostrarNome={false} /> : null))}
            </div>
          </div>
        </div>
        <div className="md:ml-auto">
          <Link href={`/pessoal/${u.id}?tab=acesso`} className="btn btn-secondary">
            Editar perfil
          </Link>
        </div>
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-gold-500/15">
        {TABS.map((t) => (
          <Link
            key={t.k}
            href={`/pessoal/${u.id}?tab=${t.k}`}
            className={`whitespace-nowrap px-3 py-2 text-sm ${
              activa === t.k ? "border-b-2 border-gold-400 text-gold-300" : "text-slate-400 hover:text-gold-200"
            }`}
          >
            {t.l}
          </Link>
        ))}
      </div>

      {activa === "resumo" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u.foto || "/emblema.png"} alt="" className="mx-auto h-48 w-48 rounded-2xl object-cover ring-2 ring-gold-500/30" />
            {u.bio && <p className="mt-4 text-sm text-slate-300">{u.bio}</p>}
          </Panel>
          <Panel titulo="Ficha" className="lg:col-span-2">
            <dl className="space-y-2 text-sm">
              <Linha k="Unidade" v={u.unit?.nome} />
              <Linha k="Cargo" v={u.position?.nome} />
              <Linha k="Especialidade" v={u.specialty ? `${u.specialty.abreviatura} · ${u.specialty.nome}` : null} />
              <Linha k="Discord" v={u.discord} />
              <Linha k="Alistamento" v={fmtData(u.dataAlistamento)} />
              <Linha k="Perfil app" v={u.role} />
            </dl>
          </Panel>
        </div>
      )}

      {activa === "colocacoes" && (
        <Panel titulo="Colocação actual">
          <p className="text-sm">
            {u.unit?.nome ?? "Sem unidade"} · {u.position?.nome ?? "Sem cargo"}
          </p>
        </Panel>
      )}

      {activa === "promocoes" && (
        <Panel titulo="Promoções">
          <ul className="space-y-2 text-sm">
            {u.promotions.length === 0 && <Vazio texto="Sem promoções." />}
            {u.promotions.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <Insignia rank={p.rank} size={20} />
                <span>
                  {p.rank?.nome} · {fmtData(p.data)} {p.notas && <span className="text-slate-500">— {p.notas}</span>}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {activa === "condecoracoes" && (
        <div className="space-y-4">
          <Panel titulo={`Condecorações do operador (${u.awards.length})`}>
            {u.awards.length === 0 ? (
              <p className="text-sm text-slate-500">Sem condecorações. Atribui uma medalha abaixo.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {u.awards.map((a) => (
                  <div key={a.id} className="relative flex flex-col items-center rounded-xl border border-gold-500/20 bg-black/20 p-3">
                    {a.award && <Medalha award={a.award} size={64} />}
                    {admin && (
                      <form action={removerCondecoracao}>
                        <input type="hidden" name="id" value={a.id} />
                        <button
                          type="submit"
                          title="Remover medalha"
                          className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full border border-red-500/40 bg-red-950 text-xs text-red-300 hover:bg-red-900"
                        >
                          ✕
                        </button>
                      </form>
                    )}
                    <div className="mt-1 text-[10px] text-slate-500">{fmtData(a.data)}</div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
          <SoEditores>
            <Panel titulo="Atribuir medalha">
              <form action={atribuirCondecoracao} className="grid gap-3 md:grid-cols-3">
                <input type="hidden" name="userId" value={u.id} />
                <Campo label="Medalha">
                  <select name="awardId" className="input" required>
                    {medalhas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome}
                        {m.designacao ? ` — ${m.designacao}` : ""}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Data">
                  <input name="data" type="date" className="input" defaultValue={new Date().toISOString().slice(0, 10)} />
                </Campo>
                <div className="flex items-end">
                  <button className="btn btn-primary">🏅 Atribuir medalha</button>
                </div>
              </form>
              <p className="mt-2 text-xs text-slate-500">
                A medalha aparece de imediato na ficha deste operador. Gerir o catálogo em Administração → Condecorações.
              </p>
            </Panel>
          </SoEditores>
        </div>
      )}

      {activa === "qualificacoes" && (
        <Panel titulo="Qualificações">
          <div className="flex flex-wrap gap-2">
            {u.qualifications.length === 0 && <p className="text-sm text-slate-500">Sem qualificações.</p>}
            {u.qualifications.map((q) =>
              q.qualification ? (
                <Tag key={q.id} tone="green">
                  {q.qualification.abreviatura} · {q.qualification.nome}
                </Tag>
              ) : null,
            )}
          </div>
        </Panel>
      )}

      {activa === "combate" && (
        <Panel titulo="Registos de combate">
          {u.combatRecords.length === 0 ? (
            <Vazio texto="Sem registos de combate." />
          ) : (
            <ul className="space-y-2 text-sm">
              {u.combatRecords.map((c) => (
                <li key={c.id}>
                  {c.titulo} · {fmtData(c.data)}
                  {c.descricao && <span className="text-slate-500"> — {c.descricao}</span>}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {activa === "eventos" && (
        <Panel titulo="Presenças em eventos">
          {u.attendance.length === 0 ? (
            <Vazio texto="Sem presenças registadas." />
          ) : (
            <ul className="space-y-2 text-sm">
              {u.attendance.map((a) => (
                <li key={a.id}>
                  {a.event?.titulo ?? "Evento"} · {a.estado}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {activa === "documentos" && (
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <Panel titulo="Documentos gerados">
            {docsGerados.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gold-500/20 px-4 py-12 text-center text-sm text-slate-500">
                Ainda não foram gerados documentos para este militar.
              </div>
            ) : (
              <ul className="space-y-2">
                {docsGerados.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 rounded-lg border border-gold-500/15 px-3 py-2">
                    <div>
                      <div className="font-semibold text-gold-200">{d.document.titulo}</div>
                      <div className="text-xs text-slate-500">
                        {d.numero} · {fmtData(d.criadoEm)}
                      </div>
                    </div>
                    <Link href={`/documentos/emitidos/${d.id}`} className="btn btn-primary !py-1 text-xs">
                      Abrir / PDF / PNG
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          {admin && (
            <div className="space-y-2">
              {(
                [
                  ["alistamento", "Gerar: Certificado de alistamento"],
                  ["condecoracao", "Gerar: Certificado de condecoração"],
                  ["qualificacao", "Gerar: Certificado de qualificação"],
                  ["promocao", "Gerar: Ordem de promoção"],
                ] as const
              ).map(([chave, label]) => (
                <form key={chave} action={gerarCertificadoRapido}>
                  <input type="hidden" name="userId" value={u.id} />
                  <input type="hidden" name="chave" value={chave} />
                  <button className="btn btn-ghost w-full justify-start !border-gold-500/30 text-left text-xs uppercase tracking-wider text-gold-300">
                    ▶ {label}
                  </button>
                </form>
              ))}
            </div>
          )}
        </div>
      )}

      {activa === "acesso" && (
        <SoEditores fallback={<Panel>Só o Comando edita o acesso e a ficha.</Panel>}>
          <Panel titulo="Editar ficha">
            <form action={actualizarMilitar} className="grid gap-3 md:grid-cols-2">
              <input type="hidden" name="id" value={u.id} />
              <Campo label="Nome">
                <input name="nome" defaultValue={u.nome} className="input" />
              </Campo>
              <Campo label="Nome de guerra">
                <input name="nomeGuerra" defaultValue={u.nomeGuerra ?? ""} className="input" />
              </Campo>
              <Campo label="Nº serviço">
                <input name="numeroServico" defaultValue={u.numeroServico ?? ""} className="input" />
              </Campo>
              <Campo label="Discord">
                <input name="discord" defaultValue={u.discord ?? ""} className="input" />
              </Campo>
              <Campo label="Foto (URL)">
                <input name="foto" defaultValue={u.foto ?? ""} className="input" />
              </Campo>
              <Campo label="Patente">
                <select name="rankId" defaultValue={u.rankId ?? ""} className="input">
                  <option value="">—</option>
                  {patentes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.abreviatura} — {p.nome}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo label="Cargo">
                <select name="positionId" defaultValue={u.positionId ?? ""} className="input">
                  <option value="">—</option>
                  {cargos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo label="Especialidade">
                <select name="specialtyId" defaultValue={u.specialtyId ?? ""} className="input">
                  <option value="">—</option>
                  {specs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.abreviatura}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo label="Estado">
                <select name="statusId" defaultValue={u.statusId ?? ""} className="input">
                  <option value="">—</option>
                  {estados.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo label="Unidade">
                <select name="unitId" defaultValue={u.unitId ?? ""} className="input">
                  <option value="">—</option>
                  {unidades.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo label="Bio">
                <textarea name="bio" defaultValue={u.bio ?? ""} className="input min-h-20" />
              </Campo>
              <div className="md:col-span-2">
                <button className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </Panel>
          <Panel titulo="Zona de perigo" className="!border-red-500/40">
            <p className="text-sm text-red-200">
              Apagar o ficheiro do operador remove todos os registos associados (presenças, promoções,
              condecorações, documentos, fotos e mensagens). Esta acção é <b>irreversível</b>.
            </p>
            <form action={apagarOperador} className="mt-3">
              <input type="hidden" name="id" value={u.id} />
              <button className="btn btn-danger">🗑 Apagar ficheiro do operador</button>
            </form>
          </Panel>
        </SoEditores>
      )}
    </div>
  );
}

function Linha({ k, v }: { k: string; v?: string | null }) {
  return (
    <div className="flex justify-between gap-3 border-b border-white/5 pb-1">
      <dt className="text-slate-500">{k}</dt>
      <dd>{v ?? "—"}</dd>
    </div>
  );
}
