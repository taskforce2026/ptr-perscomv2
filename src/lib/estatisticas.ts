import { db } from "@/db";

export type Periodo = "30d" | "90d" | "180d" | "365d" | "tudo";

export type LinhaOperador = {
  id: number;
  nome: string;
  nomeGuerra: string | null;
  unidade: string | null;
  rank: { nome: string; abreviatura: string; imagem: string | null; ordem: number } | null;
  estado: { nome: string; cor: string } | null;
  assiduidade: number;
  presencas: number;
  faltas: number;
  justificados: number;
  talvez: number;
  eventosElegiveis: number;
  operacoes: number;
  ultimaOperacao: Date | null;
  promocoes: number;
  ultimaPromocao: Date | null;
  condecoracoes: number;
  qualificacoes: number;
  diasServico: number;
  dataAlistamento: Date | null;
  pontuacao: number;
};

const DIAS: Record<Exclude<Periodo, "tudo">, number> = {
  "30d": 30,
  "90d": 90,
  "180d": 180,
  "365d": 365,
};

export function inicioPeriodo(p: Periodo): Date | null {
  if (p === "tudo") return null;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - DIAS[p]);
  return d;
}

function noPeriodo(d: Date | string | null | undefined, inicio: Date | null) {
  if (!d) return false;
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return false;
  if (!inicio) return true;
  return dt >= inicio;
}

function chaveMes(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function ultimos12Meses() {
  const now = new Date();
  const meses: { chave: string; rotulo: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    meses.push({
      chave: chaveMes(d),
      rotulo: d.toLocaleDateString("pt-PT", { month: "short" }).replace(".", ""),
    });
  }
  return meses;
}

export async function estatisticasGerais(periodo: Periodo, serverId?: number | null) {
  const inicio = inicioPeriodo(periodo);
  const agora = new Date();
  const mesesInfo = ultimos12Meses();

  const [militaresAll, eventosAll, presencas, promocoes, condecoracoes, qualificacoes, candidaturasAll, audit, unidades, patentes, especialidades, estados, awards] =
    await Promise.all([
      db.query.users.findMany({
        with: { rank: true, unit: true, specialty: true, status: true },
      }),
      db.query.events.findMany(),
      db.query.eventAttendance.findMany({ with: { event: true } }),
      db.query.promotions.findMany(),
      db.query.userAwards.findMany({ with: { award: true } }),
      db.query.userQualifications.findMany({ with: { qualification: true } }),
      db.query.enlistmentApplications.findMany(),
      db.query.auditLog.findMany(),
      db.query.units.findMany({ orderBy: (u, { asc }) => asc(u.ordem) }),
      db.query.ranks.findMany({ orderBy: (r, { desc }) => desc(r.ordem) }),
      db.query.specialties.findMany({ orderBy: (s, { asc }) => asc(s.ordem) }),
      db.query.statuses.findMany({ orderBy: (s, { asc }) => asc(s.ordem) }),
      db.query.awards.findMany({ orderBy: (a, { asc }) => asc(a.ordem) }),
    ]);

  const militares = serverId
    ? militaresAll.filter((m) => m.serverId === serverId)
    : militaresAll;
  const ids = new Set(militares.map((m) => m.id));
  const eventos = serverId ? eventosAll.filter((e) => e.serverId === serverId) : eventosAll;
  const candidaturas = serverId
    ? candidaturasAll.filter((c) => c.serverId === serverId)
    : candidaturasAll;

  const eventIds = new Set(eventos.map((e) => e.id));
  const eventosRealizados = eventos.filter((e) => e.dataInicio < agora && noPeriodo(e.dataInicio, inicio));
  const eventosFuturos = eventos.filter((e) => e.dataInicio >= agora).length;
  const presencasPeriodo = presencas.filter(
    (p) => p.event && eventIds.has(p.event.id) && noPeriodo(p.event.dataInicio, inicio) && p.event.dataInicio < agora,
  );
  const presentes = presencasPeriodo.filter((p) => p.estado === "Presente").length;
  const assiduidade = presencasPeriodo.length ? Math.round((presentes / presencasPeriodo.length) * 100) : 0;

  const promosP = promocoes.filter((p) => ids.has(p.userId) && noPeriodo(p.data, inicio));
  const condsP = condecoracoes.filter((c) => ids.has(c.userId) && noPeriodo(c.data, inicio));
  const qualsP = qualificacoes.filter((q) => ids.has(q.userId) && noPeriodo(q.data, inicio));
  const candsP = candidaturas.filter((c) => noPeriodo(c.data, inicio));
  const alistP = militares.filter((m) => noPeriodo(m.dataAlistamento, inicio));
  const auditP = audit.filter((a) => noPeriodo(a.criadoEm, inicio));

  const tipos = ["Treino", "Missão", "Operação", "Reunião"];
  const eventosMensais = tipos.map((tipo) => ({
    tipo,
    valores: mesesInfo.map(
      (m) => eventos.filter((e) => e.tipo === tipo && chaveMes(e.dataInicio) === m.chave).length,
    ),
  }));

  const contarPorMes = (datas: Date[]) =>
    mesesInfo.map((m) => datas.filter((d) => chaveMes(d) === m.chave).length);

  const presencasPorEstado = ["Presente", "Talvez", "Ausente", "Justificado"].map((estado) => ({
    estado,
    n: presencasPeriodo.filter((p) => p.estado === estado).length,
  }));

  const porEstado = estados.map((s) => ({
    nome: s.nome,
    cor: s.cor,
    n: militares.filter((m) => m.statusId === s.id).length,
  }));

  const porUnidade = unidades.map((u) => ({
    nome: u.nome,
    n: militares.filter((m) => m.unitId === u.id).length,
  }));

  const porPatente = patentes.map((p) => ({
    nome: p.abreviatura,
    nomeCompleto: p.nome,
    n: militares.filter((m) => m.rankId === p.id).length,
  }));

  const topCondecoracoes = awards.map((a) => ({
    nome: a.nome,
    imagem: a.imagem,
    n: condsP.filter((c) => c.awardId === a.id).length,
  }));

  const topQualificacoes = Array.from(
    qualsP.reduce((map, q) => {
      const nome = q.qualification?.nome ?? "Qualificação";
      const abrev = q.qualification?.abreviatura ?? "";
      const cur = map.get(nome) ?? { nome, abrev, n: 0 };
      cur.n += 1;
      map.set(nome, cur);
      return map;
    }, new Map<string, { nome: string; abrev: string; n: number }>()),
  )
    .map(([, v]) => v)
    .sort((a, b) => b.n - a.n);

  const porEspecialidade = especialidades.map((s) => ({
    nome: s.abreviatura,
    n: militares.filter((m) => m.specialtyId === s.id).length,
  }));

  const eventosPorTipo = tipos.map((tipo) => ({
    tipo,
    n: eventosRealizados.filter((e) => e.tipo === tipo).length,
  }));

  const candEstados = ["Pendente", "Aprovada", "Rejeitada", "Em Análise", "Aceite"];
  const candidaturasPorEstado = candEstados.map((status) => ({
    status,
    n: candsP.filter((c) => c.status === status).length,
  }));

  const actividadePorEntidade = Object.entries(
    auditP.reduce<Record<string, number>>((acc, a) => {
      const k = a.accao.split(" ")[0] || "Outro";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([entidade, n]) => ({ entidade, n }))
    .sort((a, b) => b.n - a.n);

  const actividadePorActor = Object.entries(
    auditP.reduce<Record<string, number>>((acc, a) => {
      const k = a.actor || "Sistema";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([actor, n]) => ({ actor, n }))
    .sort((a, b) => b.n - a.n);

  return {
    meses: mesesInfo.map((m) => m.rotulo),
    totais: {
      militares: militares.length,
      assiduidade,
      eventos: eventosRealizados.length,
      eventosFuturos,
      promocoes: promosP.length,
      condecoracoes: condsP.length,
      qualificacoes: qualsP.length,
      candidaturas: candsP.length,
      contas: militares.filter((m) => m.passwordHash && m.contaEstado === "aprovada").length,
    },
    eventosMensais,
    presencasPorEstado,
    porEstado,
    porUnidade,
    porPatente,
    promocoesMensais: contarPorMes(promosP.map((p) => p.data)),
    condecoracoesMensais: contarPorMes(condsP.map((c) => c.data)),
    alistamentosMensais: contarPorMes(alistP.map((m) => m.dataAlistamento!).filter(Boolean)),
    topCondecoracoes,
    topQualificacoes,
    porEspecialidade,
    eventosPorTipo,
    candidaturasPorEstado,
    actividadePorEntidade,
    actividadePorActor,
  };
}

export async function estatisticasOperadores(periodo: Periodo, serverId?: number | null): Promise<LinhaOperador[]> {
  const inicio = inicioPeriodo(periodo);
  const agora = new Date();
  const [militaresAll, eventosAll] = await Promise.all([
    db.query.users.findMany({
      with: {
        rank: true,
        unit: true,
        status: true,
        promotions: true,
        awards: true,
        qualifications: true,
        combatRecords: true,
        attendance: { with: { event: true } },
      },
    }),
    db.query.events.findMany(),
  ]);

  const militares = serverId ? militaresAll.filter((m) => m.serverId === serverId) : militaresAll;
  const eventos = serverId ? eventosAll.filter((e) => e.serverId === serverId) : eventosAll;

  const eventosPassados = eventos.filter((e) => e.dataInicio < agora && noPeriodo(e.dataInicio, inicio));

  return militares.map((m) => {
    const alist = m.dataAlistamento;
    const elegiveis = eventosPassados.filter((e) => {
      if (alist && e.dataInicio < alist) return false;
      if (e.unitId && m.unitId && e.unitId !== m.unitId) return false;
      return true;
    });
    const marcas = (m.attendance ?? []).filter((a) => a.event && noPeriodo(a.event.dataInicio, inicio) && a.event.dataInicio < agora);
    const pres = marcas.filter((a) => a.estado === "Presente").length;
    const faltas = marcas.filter((a) => a.estado === "Ausente").length;
    const justificados = marcas.filter((a) => a.estado === "Justificado").length;
    const talvez = marcas.filter((a) => a.estado === "Talvez").length;
    const eventosElegiveis = Math.max(elegiveis.length, marcas.length);
    const assiduidade = eventosElegiveis ? Math.round((pres / eventosElegiveis) * 100) : 0;
    const promos = m.promotions.filter((p) => noPeriodo(p.data, inicio));
    const conds = m.awards.filter((a) => noPeriodo(a.data, inicio));
    const quals = m.qualifications.filter((q) => noPeriodo(q.data, inicio));
    const ops = m.combatRecords.filter((c) => noPeriodo(c.data, inicio));
    const ultimaOp = ops.sort((a, b) => +b.data - +a.data)[0]?.data ?? null;
    const ultimaProm = promos.sort((a, b) => +b.data - +a.data)[0]?.data ?? null;
    const diasServico = alist ? Math.max(0, Math.round((agora.getTime() - alist.getTime()) / 86400000)) : 0;
    const pontuacao = pres * 3 + ops.length * 4 + quals.length * 5 + promos.length * 6 + conds.length * 8 + justificados * 1 + faltas * -2;

    return {
      id: m.id,
      nome: m.nome,
      nomeGuerra: m.nomeGuerra,
      unidade: m.unit?.nome ?? null,
      rank: m.rank,
      estado: m.status,
      assiduidade,
      presencas: pres,
      faltas,
      justificados,
      talvez,
      eventosElegiveis,
      operacoes: ops.length,
      ultimaOperacao: ultimaOp,
      promocoes: promos.length,
      ultimaPromocao: ultimaProm,
      condecoracoes: conds.length,
      qualificacoes: quals.length,
      diasServico,
      dataAlistamento: alist,
      pontuacao,
    };
  });
}
