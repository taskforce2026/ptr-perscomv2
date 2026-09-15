import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  awards,
  auditLog,
  chatMessages,
  documents,
  enlistmentApplications,
  events,
  eventAttendance,
  forms,
  notices,
  photos,
  positions,
  promotions,
  qualifications,
  ranks,
  rosters,
  servers,
  specialties,
  statuses,
  tabPermissions,
  units,
  userAwards,
  userQualifications,
  users,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { MODELOS_PADRAO } from "@/lib/documentos";
import { garantirEsquema } from "@/db/migrar";

const FOTOS = [
  "https://images.pexels.com/photos/29561688/pexels-photo-29561688.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  "https://images.pexels.com/photos/23384429/pexels-photo-23384429.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  "https://images.pexels.com/photos/30180505/pexels-photo-30180505.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  "https://images.pexels.com/photos/30687138/pexels-photo-30687138.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  "https://images.pexels.com/photos/30042244/pexels-photo-30042244.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  "https://images.pexels.com/photos/30687112/pexels-photo-30687112.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  "https://images.pexels.com/photos/10901963/pexels-photo-10901963.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  "https://images.pexels.com/photos/29561685/pexels-photo-29561685.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
];

let ready: Promise<void> | null = null;

export function ensureSeed() {
  if (!ready) ready = seed().catch((err) => {
    ready = null;
    console.error("Seed falhou:", err);
  });
  return ready;
}

const RANK_DEFS = [
  { nome: "Recruta", abreviatura: "Rec", ordem: 1, imagem: "/patentes/Rec.svg", categoria: "praca" },
  { nome: "Soldado", abreviatura: "Sold", ordem: 2, imagem: "/patentes/Sold.svg", categoria: "praca" },
  { nome: "Segundo-Cabo", abreviatura: "2Cab", ordem: 3, imagem: "/patentes/2Cab.svg", categoria: "praca" },
  { nome: "Primeiro-Cabo", abreviatura: "1Cab", ordem: 4, imagem: "/patentes/1Cab.svg", categoria: "praca" },
  { nome: "Cabo-Adjunto", abreviatura: "CAdj", ordem: 5, imagem: "/patentes/CAdj.svg", categoria: "praca" },
  { nome: "Cabo-Mor", abreviatura: "CMor", ordem: 6, imagem: "/patentes/CMor.svg", categoria: "praca" },
  { nome: "Segundo-Furriel", abreviatura: "2Fur", ordem: 7, imagem: "/patentes/2Fur.svg", categoria: "praca" },
  { nome: "Furriel", abreviatura: "Fur", ordem: 8, imagem: "/patentes/Fur.svg", categoria: "praca" },
  { nome: "Segundo-Sargento", abreviatura: "2Sarg", ordem: 9, imagem: "/patentes/2Sarg.svg", categoria: "sargento" },
  { nome: "Primeiro-Sargento", abreviatura: "1Sarg", ordem: 10, imagem: "/patentes/1Sarg.svg", categoria: "sargento" },
  { nome: "Sargento-Ajudante", abreviatura: "SAj", ordem: 11, imagem: "/patentes/SAj.svg", categoria: "sargento" },
  { nome: "Sargento-Chefe", abreviatura: "SCh", ordem: 12, imagem: "/patentes/SCh.svg", categoria: "sargento" },
  { nome: "Sargento-Mor", abreviatura: "SMor", ordem: 13, imagem: "/patentes/SMor.svg", categoria: "sargento" },
  { nome: "Aspirante a Oficial", abreviatura: "AspOf", ordem: 14, imagem: "/patentes/AspOf.svg", categoria: "oficial" },
  { nome: "Alferes", abreviatura: "Alf", ordem: 15, imagem: "/patentes/Alf.svg", categoria: "oficial" },
  { nome: "Tenente", abreviatura: "Ten", ordem: 16, imagem: "/patentes/Ten.svg", categoria: "oficial" },
  { nome: "Capitão", abreviatura: "Cap", ordem: 17, imagem: "/patentes/Cap.svg", categoria: "oficial" },
  { nome: "Major", abreviatura: "Maj", ordem: 18, imagem: "/patentes/Maj.svg", categoria: "oficial" },
  { nome: "Tenente-Coronel", abreviatura: "TCor", ordem: 19, imagem: "/patentes/TCor.svg", categoria: "oficial" },
  { nome: "Coronel", abreviatura: "Cor", ordem: 20, imagem: "/patentes/Cor.svg", categoria: "oficial" },
  { nome: "Brigadeiro-General", abreviatura: "BGen", ordem: 21, imagem: "/patentes/BGen.svg", categoria: "general" },
  { nome: "Major-General", abreviatura: "MGen", ordem: 22, imagem: "/patentes/MGen.svg", categoria: "general" },
  { nome: "Tenente-General", abreviatura: "TGen", ordem: 23, imagem: "/patentes/TGen.svg", categoria: "general" },
  { nome: "General", abreviatura: "Gen", ordem: 24, imagem: "/patentes/Gen.svg", categoria: "general" },
];

const CARGO_DEFS = [
  { nome: "Comandante da Taskforce", ordem: 1 },
  { nome: "2º Comandante", ordem: 2 },
  { nome: "Comandante de Pelotão", ordem: 3 },
  { nome: "Sargento de Pelotão", ordem: 4 },
  { nome: "Comandante de Secção", ordem: 5 },
  { nome: "Comandante de Esquadra", ordem: 6 },
  { nome: "Atirador", ordem: 7 },
  { nome: "Apontador de Metralhadora", ordem: 8 },
  { nome: "Grenadeiro", ordem: 9 },
  { nome: "Médico de Combate", ordem: 10 },
  { nome: "Operador Rádio", ordem: 11 },
  { nome: "Instrutor", ordem: 12 },
];

const MEDAL_DEFS = [
  { nome: "Cruz de Guerra", designacao: "Cruz de Guerra — 1.ª Classe", descricao: "Actos de bravura em combate.", imagem: "/medalhas/cruz-de-guerra.svg", ordem: 1 },
  { nome: "Valor Militar", designacao: "Medalha de Valor Militar", descricao: "Mérito excepcional em operação.", imagem: "/medalhas/valor-militar.svg", ordem: 2 },
  { nome: "Coração Púrpura", designacao: "Medalha do Coração Púrpura", descricao: "Ferido em acção.", imagem: "/medalhas/coracao-purpura.svg", ordem: 3 },
  { nome: "Mérito", designacao: "Medalha de Mérito da PTR", descricao: "Serviço meritório à unidade.", imagem: "/medalhas/merito.svg", ordem: 4 },
  { nome: "Assiduidade", designacao: "Distintivo de Assiduidade", descricao: "Presença exemplar nos treinos e missões.", imagem: "/medalhas/assiduidade.svg", ordem: 5 },
  { nome: "Campanha", designacao: "Medalha de Campanha", descricao: "Participação em campanha oficial.", imagem: "/medalhas/campanha.svg", ordem: 6 },
  { nome: "Fénix", designacao: "Distintivo da Fénix", descricao: "Distintivo da Phoenix Taskforce Rangers.", imagem: "/medalhas/fenix.svg", ordem: 7 },
  { nome: "Instrutor", designacao: "Distintivo de Instrutor", descricao: "Qualificação e serviço como instrutor.", imagem: "/medalhas/instrutor.svg", ordem: 8 },
  { nome: "Liderança", designacao: "Medalha de Liderança no Terreno", descricao: "Liderança comprovada em operação.", imagem: "/medalhas/lideranca.svg", ordem: 9 },
  { nome: "Tiro de Elite", designacao: "Distintivo de Tiro de Elite", descricao: "Excelência de tiro.", imagem: "/medalhas/tiro-de-elite.svg", ordem: 10 },
  { nome: "Comportamento Exemplar", designacao: "Medalha de Comportamento Exemplar", descricao: "Conduta exemplar no efectivo.", imagem: "/medalhas/comportamento-exemplar.svg", ordem: 11 },
  { nome: "Recrutamento", designacao: "Distintivo de Recrutamento", descricao: "Apoio ao alistamento e formação de novos operadores.", imagem: "/medalhas/recrutamento.svg", ordem: 12 },
  { nome: "Ordem da Fénix", designacao: "Ordem da Fénix — Grau de Cavaleiro", descricao: "A mais alta distinção da PTR.", imagem: "/medalhas/ordem-fenix.svg", ordem: 13 },
  { nome: "Serviços Distintos", designacao: "Medalha de Ouro de Serviços Distintos", descricao: "Serviços de relevo prolongado à Taskforce.", imagem: "/medalhas/servicos-distintos.svg", ordem: 14 },
  { nome: "Cruz de São Jorge", designacao: "Cruz de São Jorge da PTR", descricao: "Coragem sob fogo inimigo.", imagem: "/medalhas/cruz-sao-jorge.svg", ordem: 15 },
  { nome: "Operações Especiais", designacao: "Distintivo de Operações Especiais", descricao: "Missões de forças especiais.", imagem: "/medalhas/ops-especiais.svg", ordem: 16 },
  { nome: "Liberação", designacao: "Medalha da Liberação", descricao: "Participação na campanha Liberation.", imagem: "/medalhas/liberacao.svg", ordem: 17 },
  { nome: "Missão Nocturna", designacao: "Distintivo de Missão Nocturna", descricao: "Operações em ambiente nocturno.", imagem: "/medalhas/missao-nocturna.svg", ordem: 18 },
  { nome: "Airborne", designacao: "Distintivo Airborne / Salto", descricao: "Qualificação de salto e inserção aérea.", imagem: "/medalhas/airborne.svg", ordem: 19 },
  { nome: "Longo Serviço", designacao: "Medalha de Longo Serviço", descricao: "Anos de serviço ininterrupto na PTR.", imagem: "/medalhas/longo-servico.svg", ordem: 20 },
  { nome: "Mérito Táctico", designacao: "Cruz de Mérito Táctico", descricao: "Decisão táctica em combate.", imagem: "/medalhas/merito-tactico.svg", ordem: 21 },
  { nome: "Combate Urbano", designacao: "Distintivo de Combate Urbano (CQB)", descricao: "Excelência em CQB e meio urbano.", imagem: "/medalhas/combate-urbano.svg", ordem: 22 },
  { nome: "Reconhecimento", designacao: "Medalha de Reconhecimento", descricao: "Patrulhas e reconhecimento avançado.", imagem: "/medalhas/reconhecimento.svg", ordem: 23 },
  { nome: "Médico de Combate", designacao: "Distintivo de Médico de Combate", descricao: "Socorro sob fogo.", imagem: "/medalhas/medico-combate.svg", ordem: 24 },
  { nome: "Cooperação", designacao: "Medalha de Cooperação", descricao: "Cooperação com unidades aliadas.", imagem: "/medalhas/cooperacao.svg", ordem: 25 },
  { nome: "Estrela de Bronze", designacao: "Estrela de Bronze da PTR", descricao: "Acção meritória em missão.", imagem: "/medalhas/estrela-bronze.svg", ordem: 26 },
  { nome: "Estrela de Prata", designacao: "Estrela de Prata da PTR", descricao: "Galantaria em combate.", imagem: "/medalhas/estrela-prata.svg", ordem: 27 },
  { nome: "Estrela de Ouro", designacao: "Estrela de Ouro da PTR", descricao: "Heroísmo excepcional.", imagem: "/medalhas/estrela-ouro.svg", ordem: 28 },
  { nome: "Mestre de Tiro", designacao: "Distintivo de Mestre de Tiro", descricao: "Qualificação máxima de tiro.", imagem: "/medalhas/mestre-tiro.svg", ordem: 29 },
  { nome: "Campanha Liberation", designacao: "Medalha de Campanha — Liberation", descricao: "Campanha no servidor Liberation.", imagem: "/medalhas/campanha-liberation.svg", ordem: 30 },
  { nome: "Cruz de Honra", designacao: "Cruz de Honra da Unidade", descricao: "Honra e lealdade à PTR.", imagem: "/medalhas/cruz-honra.svg", ordem: 31 },
  { nome: "Feridos em Campanha", designacao: "Medalha de Feridos em Campanha", descricao: "Ferido em campanha oficial.", imagem: "/medalhas/feridos-campanha.svg", ordem: 32 },
  { nome: "Distintivo CQB", designacao: "Distintivo de Combate Aproximado", descricao: "Qualificação CQB.", imagem: "/medalhas/distintivo-cqb.svg", ordem: 33 },
  { nome: "Navegação", designacao: "Distintivo de Navegação Terrestre", descricao: "Navegação e orientação no terreno.", imagem: "/medalhas/navegacao.svg", ordem: 34 },
  { nome: "Comunicações", designacao: "Distintivo de Comunicações Tácticas", descricao: "Rádio e ligações de comando.", imagem: "/medalhas/comunicacoes.svg", ordem: 35 },
  { nome: "Assalto Aéreo", designacao: "Distintivo de Assalto Aéreo", descricao: "Inserções de helicóptero.", imagem: "/medalhas/assalto-aereo.svg", ordem: 36 },
];

async function syncCatalogos() {
  for (const r of RANK_DEFS) {
    const exists = await db.query.ranks.findFirst({ where: eq(ranks.abreviatura, r.abreviatura) });
    if (exists) await db.update(ranks).set(r).where(eq(ranks.id, exists.id));
    else await db.insert(ranks).values(r);
  }
  for (const p of CARGO_DEFS) {
    const exists = await db.query.positions.findFirst({ where: eq(positions.nome, p.nome) });
    if (exists) await db.update(positions).set(p).where(eq(positions.id, exists.id));
    else await db.insert(positions).values(p);
  }
  for (const m of MEDAL_DEFS) {
    const exists = await db.query.awards.findFirst({ where: eq(awards.nome, m.nome) });
    if (exists) await db.update(awards).set(m).where(eq(awards.id, exists.id));
    else await db.insert(awards).values(m);
  }
  const abasOp = [
    "/", "/conta", "/pessoal", "/rosters", "/eventos", "/holograma", "/fotos", "/chat/operadores",
    "/estatisticas", "/servidor", "/actualizacoes", "/avisos", "/documentos", "/instalar",
  ];
  const abasEditor = [
    ...abasOp, "/candidaturas", "/formularios", "/admin/patentes", "/admin/cargos", "/admin/especialidades",
    "/admin/estados", "/admin/unidades", "/admin/rosters", "/admin/condecoracoes", "/admin/qualificacoes",
  ];
  async function syncAbas(role: string, tabs: string[]) {
    for (const tab of tabs) {
      const exists = await db.query.tabPermissions.findFirst({
        where: and(eq(tabPermissions.role, role), eq(tabPermissions.tab, tab)),
      });
      if (!exists) await db.insert(tabPermissions).values({ role, tab, permitido: true });
    }
  }
  await syncAbas("operador", abasOp);
  await syncAbas("editor", abasEditor);
  for (const m of MODELOS_PADRAO) {
    const exists = await db.query.documents.findFirst({ where: eq(documents.titulo, m.titulo) });
    if (exists) await db.update(documents).set(m).where(eq(documents.id, exists.id));
    else await db.insert(documents).values(m);
  }
  const estadoDefs = [
    { nome: "Activo", cor: "#22c55e", ordem: 1 },
    { nome: "Em Instrução", cor: "#3b82f6", ordem: 2 },
    { nome: "Licença", cor: "#eab308", ordem: 3 },
    { nome: "Reserva", cor: "#a855f7", ordem: 4 },
    { nome: "Inactivo", cor: "#94a3b8", ordem: 5 },
    { nome: "Dispensado", cor: "#ef4444", ordem: 6 },
  ];
  for (const s of estadoDefs) {
    const exists = await db.query.statuses.findFirst({ where: eq(statuses.nome, s.nome) });
    if (exists) await db.update(statuses).set(s).where(eq(statuses.id, exists.id));
    else await db.insert(statuses).values(s);
  }

  const rosterDefs = [
    { nome: "Roster Operacional", descricao: "Unidades de combate da Taskforce.", ordem: 1 },
    { nome: "Roster de Apoio", descricao: "Logística, médicos, comunicações e instrução.", ordem: 2 },
    { nome: "Reserva", descricao: "Elementos em reserva ou licença prolongada.", ordem: 3 },
  ];
  for (const r of rosterDefs) {
    const exists = await db.query.rosters.findFirst({ where: eq(rosters.nome, r.nome) });
    if (exists) await db.update(rosters).set(r).where(eq(rosters.id, exists.id));
    else await db.insert(rosters).values(r);
  }
  const allRosters = await db.select().from(rosters);
  const rid = (n: string) => allRosters.find((x) => x.nome === n)?.id ?? null;
  const unitDefs = [
    { nome: "Comando PTR", abreviatura: "CMD", descricao: "Comando da Phoenix Taskforce Rangers.", rosterId: rid("Roster Operacional"), ordem: 1 },
    { nome: "1º Pelotão - Alpha", abreviatura: "A", descricao: "Pelotão de assalto Alpha.", rosterId: rid("Roster Operacional"), ordem: 2 },
    { nome: "2º Pelotão - Bravo", abreviatura: "B", descricao: "Pelotão de assalto Bravo.", rosterId: rid("Roster Operacional"), ordem: 3 },
    { nome: "Secção de Apoio", abreviatura: "APO", descricao: "Logística, médicos e comunicações.", rosterId: rid("Roster de Apoio"), ordem: 4 },
    { nome: "Centro de Instrução", abreviatura: "CIN", descricao: "Formação de recrutas e cursos de especialidade.", rosterId: rid("Roster de Apoio"), ordem: 5 },
    { nome: "Reserva", abreviatura: "RES", descricao: "Elementos temporariamente inactivos.", rosterId: rid("Reserva"), ordem: 6 },
  ];
  for (const u of unitDefs) {
    const exists = await db.query.units.findFirst({ where: eq(units.nome, u.nome) });
    if (exists) await db.update(units).set(u).where(eq(units.id, exists.id));
    else await db.insert(units).values(u);
  }

  const arma = await db.query.servers.findFirst({ where: eq(servers.tipo, "Arma 3") });
  if (!arma) {
    await db.insert(servers).values({
      nome: "PTR Principal",
      tipo: "Arma 3",
      endereco: "ptrangers.ddns.net",
      porta: "2302",
      password: "REDPTR",
      modpack: "PTR Modpack 2026",
      notas: "Servidor principal de operações e treinos.",
      ordem: 1,
    });
  }
  const treino = await db.query.servers.findFirst({ where: eq(servers.nome, "PTR Treino") });
  if (!treino) {
    await db.insert(servers).values({
      nome: "PTR Treino",
      tipo: "Arma 3",
      endereco: "treino.ptrangers.ddns.net",
      porta: "2302",
      password: "REDPTR",
      modpack: "PTR Modpack 2026",
      notas: "Servidor de instrução e ensaios. Estatísticas próprias.",
      ordem: 2,
    });
  }
  const principal = await db.query.servers.findFirst({ where: eq(servers.nome, "PTR Principal") });
  if (principal) {
    await db.execute(sql`update users set server_id = ${principal.id} where server_id is null`);
    await db.execute(sql`update events set server_id = ${principal.id} where server_id is null`);
  }
}

async function seed() {
  await garantirEsquema();
  await syncCatalogos();
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) {
    const comando = await db.query.users.findFirst({ where: eq(users.login, "comando") });
    if (!comando) await criarContaComando();
    return;
  }

  await db.insert(specialties).values([
    { nome: "Infantaria Ligeira", abreviatura: "INF", ordem: 1 },
    { nome: "Reconhecimento", abreviatura: "REC", ordem: 2 },
    { nome: "Atirador Especial", abreviatura: "AE", ordem: 3 },
    { nome: "Médico", abreviatura: "MED", ordem: 4 },
    { nome: "Comunicações", abreviatura: "COM", ordem: 5 },
    { nome: "Explosivos", abreviatura: "EOD", ordem: 6 },
    { nome: "Piloto", abreviatura: "PIL", ordem: 7 },
  ]);

  await db.insert(qualifications).values([
    { nome: "Ranger Básico", abreviatura: "RB", ordem: 1 },
    { nome: "Ranger Avançado", abreviatura: "RA", ordem: 2 },
    { nome: "Primeiros Socorros de Combate", abreviatura: "CLS", ordem: 3 },
    { nome: "Atirador Designado", abreviatura: "DMR", ordem: 4 },
    { nome: "Comunicações Tácticas", abreviatura: "COM", ordem: 5 },
    { nome: "Salto / Airborne", abreviatura: "ABN", ordem: 6 },
  ]);

  await db.insert(servers).values([
    {
      nome: "TeamSpeak PTR",
      tipo: "TeamSpeak",
      endereco: "ts.ptrangers.ddns.net",
      porta: "9987",
      password: "REDPTR",
      notas: "Comunicações de voz da unidade.",
      ordem: 2,
    },
    {
      nome: "Discord PTR",
      tipo: "Discord",
      endereco: "discord.gg/ptrangers",
      notas: "Canal oficial da comunidade.",
      ordem: 3,
    },
  ]);

  const allRanks = await db.select().from(ranks);
  const allPos = await db.select().from(positions);
  const allSpec = await db.select().from(specialties);
  const allSt = await db.select().from(statuses);
  const allUn = await db.select().from(units);
  const allAw = await db.select().from(awards);
  const allQ = await db.select().from(qualifications);

  const rank = (abv: string) => allRanks.find((r) => r.abreviatura === abv)?.id ?? null;
  const pos = (nome: string) => allPos.find((p) => p.nome === nome)?.id ?? null;
  const spec = (abv: string) => allSpec.find((s) => s.abreviatura === abv)?.id ?? null;
  const st = (nome: string) => allSt.find((s) => s.nome === nome)?.id ?? null;
  const un = (abv: string) => allUn.find((u) => u.abreviatura === abv)?.id ?? null;
  const passComando = hashPassword(process.env.COMANDO_PASSWORD ?? "REDPTR2026");
  const passOp = hashPassword("PTR2026");

  const efectivos = [
    {
      nome: "Ricardo Silva",
      nomeGuerra: "Lobo",
      numeroServico: "PTR-001",
      discord: "lobo#0001",
      login: "comando",
      passwordHash: passComando,
      role: "comando",
      rankId: rank("Cap"),
      positionId: pos("Comandante da Taskforce"),
      specialtyId: spec("INF"),
      statusId: st("Activo"),
      unitId: un("CMD"),
      foto: FOTOS[0],
      bio: "Comandante da Phoenix Taskforce Rangers. Responsável pelo PERSCOM e pela doutrina da unidade.",
    },
    {
      nome: "Ana Costa",
      nomeGuerra: "Fénix",
      numeroServico: "PTR-002",
      discord: "fenix#0002",
      login: "fenix",
      passwordHash: passOp,
      role: "editor",
      rankId: rank("Ten"),
      positionId: pos("2º Comandante"),
      specialtyId: spec("REC"),
      statusId: st("Activo"),
      unitId: un("CMD"),
      foto: FOTOS[1],
      bio: "Oficial de operações. Coordena missões e o holograma de efectivos.",
    },
    {
      nome: "Miguel Santos",
      nomeGuerra: "Martelo",
      numeroServico: "PTR-007",
      discord: "martelo#0007",
      login: "martelo",
      passwordHash: passOp,
      role: "editor",
      rankId: rank("SCh"),
      positionId: pos("Comandante de Pelotão"),
      specialtyId: spec("INF"),
      statusId: st("Activo"),
      unitId: un("A"),
      foto: FOTOS[2],
      bio: "Sargento-chefe do 1.º Pelotão. Instrutor-chefe de combate aproximado.",
    },
    {
      nome: "João Pereira",
      nomeGuerra: "Shadow",
      numeroServico: "PTR-012",
      discord: "shadow#0012",
      login: "shadow",
      passwordHash: passOp,
      role: "operador",
      rankId: rank("1Sarg"),
      positionId: pos("Comandante de Esquadra"),
      specialtyId: spec("AE"),
      statusId: st("Activo"),
      unitId: un("A"),
      foto: FOTOS[3],
      bio: "Chefe da Esquadra Alpha. Especialista em tiro de precisão.",
    },
    {
      nome: "Pedro Oliveira",
      nomeGuerra: "Lynx",
      numeroServico: "PTR-018",
      discord: "lynx#0018",
      login: "lynx",
      passwordHash: passOp,
      role: "operador",
      rankId: rank("Alf"),
      positionId: pos("Comandante de Pelotão"),
      specialtyId: spec("REC"),
      statusId: st("Activo"),
      unitId: un("APO"),
      foto: FOTOS[4],
      bio: "Alferes do destacamento de reconhecimento.",
    },
    {
      nome: "Tiago Ferreira",
      nomeGuerra: "Ghost",
      numeroServico: "PTR-021",
      discord: "ghost#0021",
      login: "ghost",
      passwordHash: passOp,
      role: "operador",
      rankId: rank("Sold"),
      positionId: pos("Atirador"),
      specialtyId: spec("INF"),
      statusId: st("Activo"),
      unitId: un("A"),
      foto: FOTOS[5],
      bio: "Operador da Alpha. Recém-qualificado Ranger Básico.",
    },
    {
      nome: "André Rodrigues",
      nomeGuerra: "Viper",
      numeroServico: "PTR-022",
      discord: "viper#0022",
      login: "viper",
      passwordHash: passOp,
      role: "operador",
      rankId: rank("Sold"),
      positionId: pos("Apontador de Metralhadora"),
      specialtyId: spec("INF"),
      statusId: st("Activo"),
      unitId: un("B"),
      foto: FOTOS[6],
      bio: "Supressão e fogo de cobertura na Bravo.",
    },
    {
      nome: "Rui Almeida",
      nomeGuerra: "Ranger",
      numeroServico: "PTR-015",
      discord: "ranger#0015",
      login: "ranger",
      passwordHash: passOp,
      role: "operador",
      rankId: rank("Fur"),
      positionId: pos("Médico de Combate"),
      specialtyId: spec("MED"),
      statusId: st("Activo"),
      unitId: un("A"),
      foto: FOTOS[7],
      bio: "Médico de combate da Esquadra Alpha.",
    },
    {
      nome: "Carlos Mendes",
      nomeGuerra: "Aço",
      numeroServico: "PTR-009",
      discord: "aco#0009",
      login: "aco",
      passwordHash: passOp,
      role: "operador",
      rankId: rank("2Sarg"),
      positionId: pos("Comandante de Esquadra"),
      specialtyId: spec("INF"),
      statusId: st("Activo"),
      unitId: un("B"),
      foto: FOTOS[0],
      bio: "Chefe da Esquadra Bravo.",
    },
    {
      nome: "Nuno Carvalho",
      nomeGuerra: "Nite",
      numeroServico: "PTR-030",
      discord: "nite#0030",
      login: "nite",
      passwordHash: passOp,
      role: "operador",
      rankId: rank("1Cab"),
      positionId: pos("Atirador"),
      specialtyId: spec("AE"),
      statusId: st("Licença"),
      unitId: un("APO"),
      foto: FOTOS[1],
      bio: "Atirador designado. Actualmente em licença de 14 dias.",
    },
    {
      nome: "Bruno Lopes",
      nomeGuerra: "Echo",
      numeroServico: "PTR-033",
      discord: "echo#0033",
      login: "echo",
      passwordHash: passOp,
      role: "operador",
      rankId: rank("2Cab"),
      positionId: pos("Operador Rádio"),
      specialtyId: spec("COM"),
      statusId: st("Activo"),
      unitId: un("B"),
      foto: FOTOS[2],
      bio: "Rádio da Bravo. Garante ligações com o comando.",
    },
    {
      nome: "Diogo Rocha",
      nomeGuerra: "Cadete",
      numeroServico: "PTR-041",
      discord: "cadete#0041",
      login: "cadete",
      passwordHash: passOp,
      role: "operador",
      rankId: rank("Rec"),
      positionId: pos("Instrutor"),
      specialtyId: spec("INF"),
      statusId: st("Em Instrução"),
      unitId: un("CIN"),
      foto: FOTOS[3],
      bio: "Recruta em fase de formação inicial.",
    },
  ];

  const principalSrv = await db.query.servers.findFirst({ where: eq(servers.nome, "Missões") });
  const treinoSrv = await db.query.servers.findFirst({ where: eq(servers.nome, "Treino e Formação") });
  const liberationSrv = await db.query.servers.findFirst({ where: eq(servers.nome, "Liberation") });

  const inserted = await db
    .insert(users)
    .values(
      efectivos.map((e) => ({
        ...e,
        contaEstado: "aprovada",
        dataAlistamento: new Date("2024-03-15"),
        serverId:
          e.login === "cadete"
            ? treinoSrv?.id ?? null
            : e.login === "comando" || e.login === "fenix"
              ? liberationSrv?.id ?? principalSrv?.id ?? null
              : principalSrv?.id ?? null,
      })),
    )
    .returning({ id: users.id, nomeGuerra: users.nomeGuerra });

  const byGuerra = (n: string) => inserted.find((u) => u.nomeGuerra === n)?.id;

  const lobo = byGuerra("Lobo");
  const fenix = byGuerra("Fénix");
  const martelo = byGuerra("Martelo");
  const shadow = byGuerra("Shadow");
  const ranger = byGuerra("Ranger");
  const ghost = byGuerra("Ghost");

  if (lobo) {
    await db.insert(promotions).values([
      { userId: lobo, rankId: rank("Sold"), data: new Date("2023-01-10"), notas: "Alistamento" },
      { userId: lobo, rankId: rank("Cap"), data: new Date("2025-06-01"), notas: "Assunção de comando" },
    ]);
    const cruz = allAw.find((a) => a.nome === "Cruz de Guerra");
    const fenixMed = allAw.find((a) => a.nome === "Fénix");
    const lider = allAw.find((a) => a.nome === "Liderança");
    if (cruz) await db.insert(userAwards).values({ userId: lobo, awardId: cruz.id });
    if (fenixMed) await db.insert(userAwards).values({ userId: lobo, awardId: fenixMed.id });
    if (lider) await db.insert(userAwards).values({ userId: lobo, awardId: lider.id });
  }
  if (shadow) {
    const tiro = allAw.find((a) => a.nome === "Tiro de Elite");
    if (tiro) await db.insert(userAwards).values({ userId: shadow, awardId: tiro.id });
  }
  if (ranger) {
    const merito = allAw.find((a) => a.nome === "Mérito");
    if (merito) await db.insert(userAwards).values({ userId: ranger, awardId: merito.id });
  }

  const rb = allQ.find((q) => q.abreviatura === "RB");
  const cls = allQ.find((q) => q.abreviatura === "CLS");
  if (rb && lobo && fenix && martelo && shadow && ranger && ghost) {
    await db.insert(userQualifications).values(
      [lobo, fenix, martelo, shadow, ranger, ghost].map((userId) => ({
        userId,
        qualificationId: rb.id,
      })),
    );
  }
  if (cls && ranger) await db.insert(userQualifications).values({ userId: ranger, qualificationId: cls.id });

  const now = new Date();
  const treino = new Date(now);
  treino.setDate(treino.getDate() + 2);
  treino.setHours(21, 0, 0, 0);
  const missao = new Date(now);
  missao.setDate(missao.getDate() + 5);
  missao.setHours(20, 30, 0, 0);
  const passado = new Date(now);
  passado.setDate(passado.getDate() - 4);
  passado.setHours(21, 0, 0, 0);

  const [ev1] = await db
    .insert(events)
    .values([
      {
        titulo: "Treino de Combate em Meio Urbano",
        tipo: "Treino",
        briefing: "CQB nas ruas de Tanoa. Equipamento leve, munição simulada. Briefing 20:45 no TS.",
        local: "Tanoa · Georgetown",
        dataInicio: treino,
        obrigatorio: true,
        unitId: un("A"),
      },
      {
        titulo: "Operação FÉNIX NEGRA",
        tipo: "Missão",
        briefing: "Assalto nocturno a complexo insurgente. Reconhecimento prévio pelo destacamento REC.",
        local: "Livonia · Łękawka",
        dataInicio: missao,
        obrigatorio: true,
        unitId: un("CMD"),
      },
      {
        titulo: "Ensaio de Heli-inserção",
        tipo: "Treino",
        briefing: "Procedimentos de embarque e desembarque. Presenças registadas.",
        local: "Altis · AAC Airfield",
        dataInicio: passado,
        obrigatorio: false,
        unitId: un("A"),
      },
    ])
    .returning();

  if (ev1 && lobo && fenix && martelo) {
    await db.insert(eventAttendance).values([
      { eventId: ev1.id, userId: lobo, estado: "Presente" },
      { eventId: ev1.id, userId: fenix, estado: "Presente" },
      { eventId: ev1.id, userId: martelo, estado: "Talvez" },
    ]);
  }

  await db.insert(enlistmentApplications).values([
    {
      nome: "Hugo Martins",
      nomeGuerra: "Hawk",
      discord: "hawk#1190",
      idade: "24",
      experiencia: "2 anos de Arma 3, milsim UK",
      motivacao: "Quero integrar uma unidade portuguesa séria e evoluir como operador.",
      status: "Pendente",
    },
  ]);

  await db.insert(forms).values([
    {
      titulo: "Alistamento",
      descricao: "Formulário público de candidatura à PTR.",
      campos: JSON.stringify([
        { nome: "nome", etiqueta: "Nome completo" },
        { nome: "discord", etiqueta: "Discord" },
        { nome: "motivacao", etiqueta: "Motivação" },
      ]),
    },
  ]);

  await db.insert(notices).values([
    {
      titulo: "Novo holograma de efectivos",
      corpo: "Todos os operadores passam a ter acesso ao holograma, à galeria de fotos e ao chat de operadores.",
      autor: "Comando",
    },
    {
      titulo: "Operação FÉNIX NEGRA",
      corpo: "Missão obrigatória no próximo fim-de-semana. Confirmem presença no calendário.",
      autor: "Ten. Fénix",
    },
  ]);

  await db.insert(auditLog).values([
    { actor: "Comando", accao: "Sistema iniciado", detalhe: "PERSCOM PTR pronto com holograma, fotos e chats." },
    { actor: "Comando", accao: "Efectivo actualizado", detalhe: "12 operadores sincronizados no holograma." },
  ]);

  if (lobo && fenix && martelo && ghost) {
    await db.insert(photos).values([
      {
        titulo: "Ensaio no túnel",
        descricao: "Esquadra Alpha em movimento no complexo subterrâneo.",
        url: "https://images.pexels.com/photos/30687133/pexels-photo-30687133.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        album: "Treinos",
        autorId: martelo,
      },
      {
        titulo: "Operação nocturna",
        descricao: "Equipa em contacto, interior com fumo.",
        url: "https://images.pexels.com/photos/30687134/pexels-photo-30687134.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        album: "Missões",
        autorId: fenix,
      },
      {
        titulo: "Briefing de campo",
        descricao: "Leitura de carta sob luz vermelha.",
        url: "https://images.pexels.com/photos/8079175/pexels-photo-8079175.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        album: "Treinos",
        autorId: lobo,
      },
      {
        titulo: "Avanço em formação",
        descricao: "Bravo em avanço sob fumo.",
        url: "https://images.pexels.com/photos/7710577/pexels-photo-7710577.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        album: "Missões",
        autorId: ghost,
      },
      {
        titulo: "Assalto a edifício",
        descricao: "Forças especiais em CQB.",
        url: "https://images.pexels.com/photos/23384426/pexels-photo-23384426.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        album: "Missões",
        autorId: fenix,
      },
      {
        titulo: "Formação de recruta",
        descricao: "Linha de operadores após exercício com explosão simulada.",
        url: "https://images.pexels.com/photos/10854150/pexels-photo-10854150.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        album: "Formação",
        autorId: martelo,
      },
    ]);

    await db.insert(chatMessages).values([
      { canal: "operadores", autorId: martelo, texto: "Alpha e Bravo, confiram o holograma — todos os efectivos estão projectados." },
      { canal: "operadores", autorId: ghost, texto: "Recebido. Foto do ensaio já está na galeria." },
      { canal: "operadores", autorId: ranger ?? martelo, texto: "Médico da Alpha online. Quem faltar ao treino de CQB avise aqui." },
      { canal: "operadores", autorId: lobo, texto: "Boa. Chat de operadores é de toda a unidade. O de comando fica só para oficiais." },
      { canal: "comando", autorId: lobo, texto: "Oficiais: FÉNIX NEGRA é obrigatória. Confirmem ORBAT no holograma." },
      { canal: "comando", autorId: fenix, texto: "REC faz o reconhecimento 45 min antes. Pedido de silêncio rádio até contacto." },
    ]);
  }
}

async function criarContaComando() {
  const cap = await db.query.ranks.findFirst({ where: eq(ranks.abreviatura, "Cap") });
  await db.insert(users).values({
    nome: "Comando PTR",
    nomeGuerra: "Comando",
    login: "comando",
    passwordHash: hashPassword(process.env.COMANDO_PASSWORD ?? "REDPTR2026"),
    role: "comando",
    contaEstado: "aprovada",
    rankId: cap?.id ?? null,
    numeroServico: "PTR-000",
  });
}
