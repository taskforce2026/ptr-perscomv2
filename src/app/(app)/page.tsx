import Link from "next/link";
import { db } from "@/db";
import { users, enlistmentApplications, promotions, userAwards, events, auditLog, servers, photos, chatMessages } from "@/db/schema";
import { sql, desc, eq, gte, asc } from "drizzle-orm";
import { Insignia, Medalha } from "@/components/insignia";
import { Panel, Stat, StatusBadge, Vazio, SoEditores, SoComando } from "@/components/ui";
import { fmtData, fmtDataHora, nomeCompleto, corTipo, iconeTipo } from "@/lib/format";
import { exigirSessao } from "@/lib/auth";
import { qrSvg, urlPublicaApp } from "@/lib/qr";

export const dynamic = "force-dynamic";

export default async function Painel() {
  await exigirSessao();
  const [[{ totalUsers }], [{ pendentes }], porEstado, ultimasPromocoes, ultimasCondecoracoes, proximosEventos, actualizacoes, [{ nFotos }], [{ nMsgs }]] =
    await Promise.all([
      db.select({ totalUsers: sql<number>`count(*)::int` }).from(users),
      db
        .select({ pendentes: sql<number>`count(*)::int` })
        .from(enlistmentApplications)
        .where(eq(enlistmentApplications.status, "Pendente")),
      db.query.statuses.findMany({ orderBy: (s, { asc: a }) => a(s.ordem) }).then(async (sts) => {
        const counts = await db
          .select({ statusId: users.statusId, n: sql<number>`count(*)::int` })
          .from(users)
          .groupBy(users.statusId);
        return sts.map((s) => ({ ...s, n: counts.find((c) => c.statusId === s.id)?.n ?? 0 }));
      }),
      db.query.promotions.findMany({
        orderBy: [desc(promotions.data), desc(promotions.id)],
        limit: 5,
        with: { user: true, rank: true },
      }),
      db.query.userAwards.findMany({
        orderBy: [desc(userAwards.data), desc(userAwards.id)],
        limit: 6,
        with: { user: true, award: true },
      }),
      db.query.events.findMany({
        where: gte(events.dataInicio, new Date()),
        orderBy: [asc(events.dataInicio)],
        limit: 5,
        with: { unit: true },
      }),
      db.query.auditLog.findMany({ orderBy: [desc(auditLog.criadoEm)], limit: 8 }),
      db.select({ nFotos: sql<number>`count(*)::int` }).from(photos),
      db.select({ nMsgs: sql<number>`count(*)::int` }).from(chatMessages),
    ]);

  const activos = porEstado.find((s) => s.nome === "Activo")?.n ?? 0;
  const servidorPrincipal = await db.query.servers.findFirst({
    where: eq(servers.tipo, "Arma 3"),
    orderBy: (s, { asc: a }) => a(s.ordem),
  });
  const [{ nPendentes }] = await db
    .select({ nPendentes: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.contaEstado, "pendente"));
  const [base, qrPainel] = await Promise.all([urlPublicaApp(), qrSvg(`${await urlPublicaApp()}/`, 150)]);

  return (
    <div>
      <div className="panel relative mb-6 flex flex-col items-center gap-6 overflow-hidden rounded-2xl p-6 md:flex-row lg:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/hero-rangers.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/emblema.png"
          alt="Emblema Phoenix Taskforce Rangers"
          width={160}
          height={160}
          className="relative z-10 shrink-0 rounded-full shadow-2xl ring-4 ring-gold-500/30"
        />
        <div className="relative z-10 text-center md:text-left">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-500">Arma 3 · Milsim Português</div>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-black text-gold-300 lg:text-4xl">
            Phoenix Taskforce Rangers
          </h1>
          <p className="mt-2 max-w-xl text-slate-300">
            Sistema de Gestão de Pessoal (PERSCOM). Gere militares, rosters, promoções, condecorações, qualificações,
            fotos da unidade, chats e o holograma de efectivos.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
            <SoEditores>
              <Link href="/pessoal/novo" className="btn btn-primary">
                + Novo Militar
              </Link>
              <Link href="/eventos/novo" className="btn btn-secondary">
                + Agendar Evento
              </Link>
            </SoEditores>
            <Link href="/holograma" className="btn btn-secondary">
              ◈ Holograma
            </Link>
            <Link href="/fotos" className="btn btn-ghost">
              Fotos
            </Link>
            <Link href="/chat/operadores" className="btn btn-ghost">
              Chat Operadores
            </Link>
            <Link href="/alistamento" className="btn btn-ghost">
              Formulário de Alistamento
            </Link>
          </div>
        </div>
      </div>

      <SoComando>
        {nPendentes > 0 && (
          <Link
            href="/admin/acessos"
            className="panel mb-4 flex items-center justify-between gap-3 rounded-xl !border-amber-500/40 p-4 transition hover:!border-amber-400"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔐</span>
              <div>
                <div className="font-bold text-amber-200">{nPendentes} registo(s) à espera da tua aprovação</div>
                <div className="text-xs text-slate-400">Efectivos que se registaram e ainda não podem entrar na app.</div>
              </div>
            </div>
            <span className="btn btn-primary !py-1.5 text-xs">Aprovar →</span>
          </Link>
        )}
      </SoComando>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat etiqueta="Efectivo total" valor={totalUsers} href="/pessoal" icone="👤" />
        <Stat etiqueta="Activos" valor={activos} href="/pessoal?estado=Activo" icone="●" />
        <Stat etiqueta="Holograma" valor={totalUsers} href="/holograma" icone="◈" />
        <SoEditores fallback={<Stat etiqueta="Eventos agendados" valor={proximosEventos.length} href="/eventos" icone="📅" />}>
          <Stat etiqueta="Candidaturas pendentes" valor={pendentes} href="/candidaturas" icone="📥" />
        </SoEditores>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Link href="/fotos" className="panel rounded-2xl p-4 hover:border-gold-400/50">
          <div className="text-xs uppercase tracking-[0.16em] text-gold-500">🖼 Galeria</div>
          <div className="mt-1 text-2xl font-black text-gold-200">{nFotos} fotos</div>
          <p className="text-xs text-slate-400">Acesso a todos os operadores.</p>
        </Link>
        <Link href="/chat/operadores" className="panel rounded-2xl p-4 hover:border-gold-400/50">
          <div className="text-xs uppercase tracking-[0.16em] text-gold-500">💬 Chat operadores</div>
          <div className="mt-1 text-2xl font-black text-gold-200">{nMsgs} msgs</div>
          <p className="text-xs text-slate-400">Canal aberto a todo o efectivo.</p>
        </Link>
        <Link href="/chat/comando" className="panel rounded-2xl p-4 hover:border-gold-400/50">
          <div className="text-xs uppercase tracking-[0.16em] text-gold-500">★ Chat comando</div>
          <div className="mt-1 text-lg font-black text-gold-200">Oficiais</div>
          <p className="text-xs text-slate-400">Reservado a comando e oficiais.</p>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          titulo="Próximos treinos e missões"
          className="lg:col-span-2"
          accoes={
            <Link href="/eventos" className="text-xs text-gold-300 hover:underline">
              Calendário →
            </Link>
          }
        >
          {proximosEventos.length === 0 ? (
            <Vazio texto="Sem eventos agendados." />
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {proximosEventos.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/eventos/${e.id}`}
                    className="block h-full rounded-lg border border-white/5 p-3 transition hover:border-gold-500/30"
                    style={{ borderLeft: `3px solid ${corTipo(e.tipo)}` }}
                  >
                    <div className="text-xs font-bold" style={{ color: corTipo(e.tipo) }}>
                      {iconeTipo(e.tipo)} {e.tipo}
                      {e.obrigatorio && " · Obrigatório"}
                    </div>
                    <div className="font-semibold">{e.titulo}</div>
                    <div className="text-xs text-slate-400">{fmtDataHora(e.dataInicio)}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel titulo="Estado do efectivo">
          <ul className="space-y-2">
            {porEstado.map((s) => (
              <li key={s.id} className="flex items-center justify-between text-sm">
                <StatusBadge nome={s.nome} cor={s.cor} />
                <span className="font-bold text-gold-200">{s.n}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel titulo="Últimas promoções">
          {ultimasPromocoes.length === 0 ? (
            <Vazio texto="Sem promoções." />
          ) : (
            <ul className="space-y-2">
              {ultimasPromocoes.map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-sm">
                  <Insignia rank={p.rank} size={22} />
                  <span>
                    {p.user ? nomeCompleto(p.user) : "—"} → {p.rank?.abreviatura}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel titulo="Condecorações recentes">
          <div className="flex flex-wrap gap-3">
            {ultimasCondecoracoes.map((c) => (c.award ? <Medalha key={c.id} award={c.award} /> : null))}
          </div>
        </Panel>

        <Panel
          titulo="Servidor principal"
          accoes={
            <Link href="/servidor" className="text-xs text-gold-300 hover:underline">
              Ver todos →
            </Link>
          }
        >
          {servidorPrincipal ? (
            <div>
              <div className="font-bold text-gold-200">{servidorPrincipal.nome}</div>
              <div className="font-mono text-sm text-slate-300">
                {servidorPrincipal.endereco}:{servidorPrincipal.porta}
              </div>
              <div className="mt-1 text-xs text-slate-500">{servidorPrincipal.modpack}</div>
            </div>
          ) : (
            <Vazio texto="Sem servidor configurado." />
          )}
        </Panel>

        <Panel titulo="Acesso rápido à App">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <div className="relative shrink-0">
              <div className="absolute -left-1 -top-1 h-6 w-6 border-l-2 border-t-2 border-gold-400" />
              <div className="absolute -right-1 -top-1 h-6 w-6 border-r-2 border-t-2 border-gold-400" />
              <div className="absolute -bottom-1 -left-1 h-6 w-6 border-b-2 border-l-2 border-gold-400" />
              <div className="absolute -bottom-1 -right-1 h-6 w-6 border-b-2 border-r-2 border-gold-400" />
              <div
                className="w-40 rounded-lg bg-[#f6e7b2] p-2"
                dangerouslySetInnerHTML={{ __html: qrPainel }}
              />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-sm text-slate-300">
                Lê o código com o telemóvel (Android) ou abre no computador para entrares na <b>PTR PERSCOM</b>.
              </p>
              <a href="/instalar" className="btn btn-secondary mt-3 !py-1.5 text-xs">
                Instruções de instalação
              </a>
            </div>
          </div>
          <p className="mt-3 break-all text-center font-mono text-[10px] text-gold-500">{base}</p>
        </Panel>

        <Panel titulo="Actualizações" className="lg:col-span-3">
          <ul className="space-y-2 text-sm">
            {actualizacoes.map((a) => (
              <li key={a.id} className="flex justify-between gap-3 border-b border-white/5 pb-2">
                <span>
                  <span className="text-gold-400">{a.actor}</span> · {a.accao}
                  {a.detalhe && <span className="text-slate-400"> — {a.detalhe}</span>}
                </span>
                <span className="shrink-0 text-xs text-slate-500">{fmtData(a.criadoEm)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
