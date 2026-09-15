"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  awards,
  auditLog,
  documents,
  enlistmentApplications,
  events,
  eventAttendance,
  forms,
  notices,
  notifications,
  photos,
  positions,
  qualifications,
  ranks,
  rosters,
  servers,
  specialties,
  statuses,
  tabPermissions,
  units,
  userAwards,
  userDocuments,
  userTabPermissions,
  users,
} from "@/db/schema";
import { cookies } from "next/headers";
import { eComando, exigirChatComando, exigirEdicao, exigirSessao, hashPassword, podeEditar } from "@/lib/auth";
import { COOKIE_SERVIDOR, servidorSeleccionado } from "@/lib/servidor";
import { numeroDocumento, preencherModelo } from "@/lib/documentos";
import { pushATodos } from "@/lib/push";
import { notificarTodos } from "@/lib/notificacoes";

async function log(actor: string, accao: string, detalhe?: string) {
  await db.insert(auditLog).values({ actor, accao, detalhe });
}

export async function criarMilitar(formData: FormData) {
  const u = await exigirEdicao();
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) redirect("/pessoal/novo?erro=nome");
  const [novo] = await db
    .insert(users)
    .values({
      nome,
      nomeGuerra: String(formData.get("nomeGuerra") ?? "").trim() || null,
      numeroServico: String(formData.get("numeroServico") ?? "").trim() || null,
      discord: String(formData.get("discord") ?? "").trim() || null,
      foto: String(formData.get("foto") ?? "").trim() || null,
      bio: String(formData.get("bio") ?? "").trim() || null,
      rankId: num(formData.get("rankId")),
      positionId: num(formData.get("positionId")),
      specialtyId: num(formData.get("specialtyId")),
      statusId: num(formData.get("statusId")),
      unitId: num(formData.get("unitId")),
      serverId: (await servidorSeleccionado())?.id ?? null,
      dataAlistamento: new Date(),
      contaEstado: "aprovada",
      role: "operador",
    })
    .returning();
  await log(u.nomeGuerra ?? u.nome, "Novo militar", nome);
  revalidatePath("/pessoal");
  redirect(`/pessoal/${novo.id}`);
}

export async function actualizarMilitar(formData: FormData) {
  const u = await exigirEdicao();
  const id = Number(formData.get("id"));
  await db
    .update(users)
    .set({
      nome: String(formData.get("nome") ?? "").trim(),
      nomeGuerra: String(formData.get("nomeGuerra") ?? "").trim() || null,
      numeroServico: String(formData.get("numeroServico") ?? "").trim() || null,
      discord: String(formData.get("discord") ?? "").trim() || null,
      foto: String(formData.get("foto") ?? "").trim() || null,
      bio: String(formData.get("bio") ?? "").trim() || null,
      rankId: num(formData.get("rankId")),
      positionId: num(formData.get("positionId")),
      specialtyId: num(formData.get("specialtyId")),
      statusId: num(formData.get("statusId")),
      unitId: num(formData.get("unitId")),
    })
    .where(eq(users.id, id));
  await log(u.nomeGuerra ?? u.nome, "Perfil actualizado", `ID ${id}`);
  revalidatePath(`/pessoal/${id}`);
  redirect(`/pessoal/${id}`);
}

export async function criarEvento(formData: FormData) {
  const u = await exigirEdicao();
  const titulo = String(formData.get("titulo") ?? "").trim();
  const dataInicio = String(formData.get("dataInicio") ?? "");
  if (!titulo || !dataInicio) redirect("/eventos/novo?erro=campos");
  const [ev] = await db
    .insert(events)
    .values({
      titulo,
      tipo: String(formData.get("tipo") ?? "Treino"),
      briefing: String(formData.get("briefing") ?? "").trim() || null,
      local: String(formData.get("local") ?? "").trim() || null,
      dataInicio: new Date(dataInicio),
      obrigatorio: formData.get("obrigatorio") === "on",
      unitId: num(formData.get("unitId")),
      serverId: (await servidorSeleccionado())?.id ?? null,
    })
    .returning();
  await log(u.nomeGuerra ?? u.nome, "Evento criado", titulo);
  await notificarTodos({
    titulo: `Novo evento: ${titulo}`,
    corpo: `${String(formData.get("tipo") ?? "Treino")} · ${new Date(dataInicio).toLocaleString("pt-PT")}`,
    href: `/eventos/${ev.id}`,
    tipo: "evento",
  });
  // Push para TODO o efectivo (inclui quem não marca presença) com detalhes completos.
  try {
    const tipo = String(formData.get("tipo") ?? "Treino");
    const local = String(formData.get("local") ?? "").trim();
    const briefing = String(formData.get("briefing") ?? "").trim();
    const obrigatorio = formData.get("obrigatorio") === "on";
    const unidadeId = num(formData.get("unitId"));
    const unidade = unidadeId
      ? await db.query.units.findFirst({ where: eq(units.id, unidadeId) })
      : null;
    const todos = await db.query.users.findMany({
      where: eq(users.contaEstado, "aprovada"),
    });
    const detalhes = [
      `${tipo}${obrigatorio ? " · OBRIGATÓRIO" : ""}`,
      `Data: ${new Date(dataInicio).toLocaleString("pt-PT")}`,
      local ? `Local: ${local}` : "Local: a definir",
      unidade ? `Unidade: ${unidade.nome}` : "Unidade: toda a Taskforce",
    ];
    if (briefing) detalhes.push(`Briefing: ${briefing.slice(0, 300)}`);
    await pushATodos(todos.map((x) => x.id), {
      titulo: `📅 Novo evento: ${titulo}`,
      corpo: detalhes.join("\n"),
      url: `/eventos/${ev.id}`,
    });
  } catch {
    // push é melhor esforço; o evento continua criado
  }
  revalidatePath("/eventos");
  redirect(`/eventos/${ev.id}`);
}

export async function actualizarEvento(formData: FormData) {
  const u = await exigirEdicao();
  const id = Number(formData.get("id"));
  const titulo = String(formData.get("titulo") ?? "").trim();
  const dataInicio = String(formData.get("dataInicio") ?? "");
  await db
    .update(events)
    .set({
      titulo,
      tipo: String(formData.get("tipo") ?? "Treino"),
      briefing: String(formData.get("briefing") ?? "").trim() || null,
      local: String(formData.get("local") ?? "").trim() || null,
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      obrigatorio: formData.get("obrigatorio") === "on",
    })
    .where(eq(events.id, id));
  await log(u.nomeGuerra ?? u.nome, "Evento alterado", titulo);
  await notificarTodos({
    titulo: `Evento actualizado: ${titulo}`,
    corpo: "Um treino ou missão foi alterado. Confirma os detalhes no calendário.",
    href: `/eventos/${id}`,
    tipo: "evento",
  });
  revalidatePath(`/eventos/${id}`);
  redirect(`/eventos/${id}`);
}

export async function marcarPresenca(formData: FormData) {
  const u = await exigirSessao();
  const eventId = Number(formData.get("eventId"));
  const estado = String(formData.get("estado") ?? "Presente");
  const existente = await db.query.eventAttendance.findFirst({
    where: and(eq(eventAttendance.eventId, eventId), eq(eventAttendance.userId, u.id)),
  });
  if (existente) {
    await db.update(eventAttendance).set({ estado }).where(eq(eventAttendance.id, existente.id));
  } else {
    await db.insert(eventAttendance).values({ eventId, userId: u.id, estado });
  }
  revalidatePath(`/eventos/${eventId}`);
}

export async function enviarAviso(formData: FormData) {
  const u = await exigirEdicao();
  const titulo = String(formData.get("titulo") ?? "").trim();
  const corpo = String(formData.get("corpo") ?? "").trim();
  if (!titulo || !corpo) return;
  await db.insert(notices).values({ titulo, corpo, autor: u.nomeGuerra ?? u.nome });
  await log(u.nomeGuerra ?? u.nome, "Aviso enviado", titulo);
  revalidatePath("/avisos");
}

export async function candidatar(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) redirect("/alistamento?erro=nome");
  await db.insert(enlistmentApplications).values({
    nome,
    nomeGuerra: String(formData.get("nomeGuerra") ?? "").trim() || null,
    discord: String(formData.get("discord") ?? "").trim() || null,
    idade: String(formData.get("idade") ?? "").trim() || null,
    experiencia: String(formData.get("experiencia") ?? "").trim() || null,
    motivacao: String(formData.get("motivacao") ?? "").trim() || null,
  });
  redirect("/alistamento?ok=1");
}

export async function decidirCandidatura(formData: FormData) {
  const u = await exigirEdicao();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "Pendente");
  await db.update(enlistmentApplications).set({ status }).where(eq(enlistmentApplications.id, id));
  if (status === "Aprovada" || status === "Aceite") {
    const c = await db.query.enlistmentApplications.findFirst({ where: eq(enlistmentApplications.id, id) });
    if (c) {
      await db.insert(users).values({
        nome: c.nome,
        nomeGuerra: c.nomeGuerra,
        discord: c.discord,
        role: "operador",
        contaEstado: "aprovada",
        dataAlistamento: new Date(),
      });
    }
  }
  await log(u.nomeGuerra ?? u.nome, "Candidatura", `${status} #${id}`);
  revalidatePath("/candidaturas");
}

export async function criarDocumento(formData: FormData) {
  const u = await exigirEdicao();
  const titulo = String(formData.get("titulo") ?? "").trim();
  const corpo = String(formData.get("corpo") ?? "").trim();
  if (!titulo || !corpo) redirect("/documentos?erro=campos");
  await db.insert(documents).values({
    titulo,
    corpo,
    tipo: String(formData.get("tipo") ?? "Certificado"),
    referencia: String(formData.get("referencia") ?? "").trim() || null,
  });
  await log(u.nomeGuerra ?? u.nome, "Modelo criado", titulo);
  revalidatePath("/documentos");
  redirect("/documentos");
}

export async function actualizarDocumento(formData: FormData) {
  const u = await exigirEdicao();
  const id = Number(formData.get("id"));
  await db
    .update(documents)
    .set({
      titulo: String(formData.get("titulo") ?? "").trim(),
      corpo: String(formData.get("corpo") ?? "").trim(),
      tipo: String(formData.get("tipo") ?? "Certificado"),
      referencia: String(formData.get("referencia") ?? "").trim() || null,
    })
    .where(eq(documents.id, id));
  await log(u.nomeGuerra ?? u.nome, "Modelo editado", String(id));
  revalidatePath("/documentos");
  redirect(`/documentos/${id}`);
}

export async function apagarDocumento(formData: FormData) {
  const u = await exigirEdicao();
  const id = Number(formData.get("id"));
  await db.delete(documents).where(eq(documents.id, id));
  await log(u.nomeGuerra ?? u.nome, "Modelo apagado", String(id));
  revalidatePath("/documentos");
  redirect("/documentos");
}

export async function emitirDocumento(formData: FormData) {
  const u = await exigirEdicao();
  const documentId = Number(formData.get("documentId"));
  const userId = Number(formData.get("userId"));
  const modelo = await db.query.documents.findFirst({ where: eq(documents.id, documentId) });
  const militar = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: { rank: true, unit: true, status: true, position: true },
  });
  if (!modelo || !militar) redirect("/documentos?erro=dados");
  const extras: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && k.startsWith("p_")) extras[k.slice(2)] = v;
  }
  const dados: Record<string, string> = {
    nome: militar.nome,
    nomeGuerra: militar.nomeGuerra ?? militar.nome,
    patente: militar.rank?.nome ?? militar.rank?.abreviatura ?? "",
    unidade: militar.unit?.nome ?? "Sem unidade",
    nservico: militar.numeroServico ?? "—",
    estado: militar.status?.nome ?? "",
    data: new Date().toLocaleDateString("pt-PT"),
    comando: u.nomeGuerra ?? u.nome,
    alistamento: militar.dataAlistamento ? militar.dataAlistamento.toLocaleDateString("pt-PT") : "—",
    cargo: militar.position?.nome ?? "",
    qualificacao: extras.qualificacao ?? "",
    missao: extras.missao ?? "",
    treino: extras.treino ?? "",
    operacao: extras.operacao ?? "",
    curso: extras.curso ?? "",
    classificacao: extras.classificacao ?? "",
    novaPatente: extras.novaPatente ?? "",
    ...extras,
  };
  const corpo = preencherModelo(modelo.corpo, dados);
  const [emitido] = await db
    .insert(userDocuments)
    .values({
      documentId,
      userId,
      corpo,
      numero: "TMP",
      emitidoPor: u.nomeGuerra ?? u.nome,
      notas: String(formData.get("notas") ?? "").trim() || null,
    })
    .returning();
  const numero = numeroDocumento(modelo.tipo, emitido.id);
  await db.update(userDocuments).set({ numero }).where(eq(userDocuments.id, emitido.id));
  await log(u.nomeGuerra ?? u.nome, "Documento emitido", `${numero} → ${militar.nome}`);
  revalidatePath("/documentos");
  redirect(`/documentos/emitidos/${emitido.id}`);
}

export async function gerarCertificadoRapido(formData: FormData) {
  const u = await exigirEdicao();
  const userId = Number(formData.get("userId"));
  const chave = String(formData.get("chave") ?? "");
  const mapa: Record<string, string> = {
    alistamento: "Certificado de Alistamento",
    condecoracao: "Certificado de Condecoração",
    qualificacao: "Certificado de Qualificação",
    promocao: "Ordem de Promoção",
  };
  const titulo = mapa[chave];
  if (!titulo) redirect(`/pessoal/${userId}?tab=documentos`);
  let modelo = await db.query.documents.findFirst({ where: eq(documents.titulo, titulo) });
  if (!modelo) {
    const def = (await import("@/lib/documentos")).MODELOS_PADRAO.find((m) => m.titulo === titulo);
    if (def) {
      const [criado] = await db.insert(documents).values(def).returning();
      modelo = criado;
    }
  }
  if (!modelo) redirect(`/pessoal/${userId}?tab=documentos&erro=modelo`);
  const militar = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      rank: true,
      unit: true,
      status: true,
      position: true,
      awards: { with: { award: true } },
      qualifications: { with: { qualification: true } },
      promotions: { with: { rank: true } },
    },
  });
  if (!militar) redirect("/pessoal");
  const ultimaCond = militar.awards[0]?.award?.designacao || militar.awards[0]?.award?.nome || "Condecoração da PTR";
  const ultimaQual = militar.qualifications[0]?.qualification?.nome || "Qualificação da PTR";
  const ultimaProm = militar.promotions[0]?.rank?.nome || militar.rank?.nome || "";
  const dados: Record<string, string> = {
    nome: militar.nome,
    nomeGuerra: militar.nomeGuerra ?? militar.nome,
    patente: militar.rank?.nome ?? "",
    unidade: militar.unit?.nome ?? "",
    nservico: militar.numeroServico ?? "—",
    estado: militar.status?.nome ?? "",
    data: new Date().toLocaleDateString("pt-PT"),
    comando: u.nomeGuerra ?? u.nome,
    cargo: militar.position?.nome ?? "",
    qualificacao: chave === "condecoracao" ? ultimaCond : ultimaQual,
    novaPatente: ultimaProm,
    alistamento: militar.dataAlistamento ? militar.dataAlistamento.toLocaleDateString("pt-PT") : "—",
  };
  const corpo = preencherModelo(modelo.corpo, dados);
  const [emitido] = await db
    .insert(userDocuments)
    .values({
      documentId: modelo.id,
      userId,
      corpo,
      numero: "TMP",
      emitidoPor: "O Comandante da Taskforce",
    })
    .returning();
  const numero = numeroDocumento(modelo.tipo, emitido.id);
  await db.update(userDocuments).set({ numero }).where(eq(userDocuments.id, emitido.id));
  await log(u.nomeGuerra ?? u.nome, "Certificado gerado", `${titulo} → ${militar.nome}`);
  revalidatePath(`/pessoal/${userId}`);
  redirect(`/documentos/emitidos/${emitido.id}`);
}

export async function atribuirCondecoracao(formData: FormData) {
  const u = await exigirEdicao();
  const userId = Number(formData.get("userId"));
  const awardId = Number(formData.get("awardId"));
  const data = String(formData.get("data") ?? "");
  if (!userId || !awardId) redirect("/pessoal");
  const existente = await db.query.userAwards.findFirst({
    where: and(eq(userAwards.userId, userId), eq(userAwards.awardId, awardId)),
  });
  if (!existente) {
    await db.insert(userAwards).values({
      userId,
      awardId,
      data: data ? new Date(data) : new Date(),
    });
  }
  const [award, alvo] = await Promise.all([
    db.query.awards.findFirst({ where: eq(awards.id, awardId) }),
    db.query.users.findFirst({ where: eq(users.id, userId) }),
  ]);
  await log(u.nomeGuerra ?? u.nome, "Condecoração atribuída", `${award?.nome ?? awardId} → ${alvo?.nome ?? userId}`);
  revalidatePath(`/pessoal/${userId}`);
  redirect(`/pessoal/${userId}?tab=condecoracoes`);
}

export async function removerCondecoracao(formData: FormData) {
  const u = await exigirEdicao();
  const id = Number(formData.get("id"));
  const rec = await db.query.userAwards.findFirst({ where: eq(userAwards.id, id) });
  if (!rec) redirect("/pessoal");
  await db.delete(userAwards).where(eq(userAwards.id, id));
  await log(u.nomeGuerra ?? u.nome, "Condecoração removida", `ID ${id}`);
  revalidatePath(`/pessoal/${rec.userId}`);
  redirect(`/pessoal/${rec.userId}?tab=condecoracoes`);
}

export async function apagarOperador(formData: FormData) {
  const u = await exigirEdicao();
  const id = Number(formData.get("id"));
  const alvo = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!alvo) redirect("/pessoal");
  if (alvo.id === u.id) redirect("/pessoal?erro=tu");
  await db.delete(users).where(eq(users.id, id));
  await log(u.nomeGuerra ?? u.nome, "Operador removido", alvo.nome);
  revalidatePath("/pessoal");
  revalidatePath("/");
  redirect("/pessoal?apagado=1");
}

export async function apagarEmissao(formData: FormData) {
  const u = await exigirEdicao();
  const id = Number(formData.get("id"));
  await db.delete(userDocuments).where(eq(userDocuments.id, id));
  await log(u.nomeGuerra ?? u.nome, "Emissão apagada", String(id));
  revalidatePath("/documentos");
  redirect("/documentos");
}

export async function apagarFoto(formData: FormData) {
  const u = await exigirSessao();
  const id = Number(formData.get("id"));
  const foto = await db.query.photos.findFirst({ where: eq(photos.id, id) });
  if (!foto) redirect("/fotos");
  if (!podeEditar(u) && foto.autorId !== u.id) redirect("/sem-permissao");
  await db.delete(photos).where(eq(photos.id, id));
  await log(u.nomeGuerra ?? u.nome, "Publicação apagada", foto.titulo);
  revalidatePath("/fotos");
  redirect("/fotos");
}

export async function apagarAviso(formData: FormData) {
  const u = await exigirEdicao();
  const id = Number(formData.get("id"));
  await db.delete(notices).where(eq(notices.id, id));
  await log(u.nomeGuerra ?? u.nome, "Aviso apagado", String(id));
  revalidatePath("/avisos");
}

export async function criarFormulario(formData: FormData) {
  const u = await exigirEdicao();
  const titulo = String(formData.get("titulo") ?? "Formulário").trim();
  await db.insert(forms).values({
    titulo,
    descricao: String(formData.get("descricao") ?? "").trim() || null,
    campos: "[]",
  });
  await log(u.nomeGuerra ?? u.nome, "Formulário criado", titulo);
  revalidatePath("/formularios");
}

export async function actualizarFormulario(formData: FormData) {
  const u = await exigirEdicao();
  const id = Number(formData.get("id"));
  const titulo = String(formData.get("titulo") ?? "").trim();
  await db
    .update(forms)
    .set({
      titulo,
      descricao: String(formData.get("descricao") ?? "").trim() || null,
    })
    .where(eq(forms.id, id));
  await log(u.nomeGuerra ?? u.nome, "Formulário editado", titulo);
  revalidatePath("/formularios");
  redirect("/formularios");
}

export async function apagarFormulario(formData: FormData) {
  const u = await exigirEdicao();
  const id = Number(formData.get("id"));
  const f = await db.query.forms.findFirst({ where: eq(forms.id, id) });
  await db.delete(forms).where(eq(forms.id, id));
  await log(u.nomeGuerra ?? u.nome, "Formulário apagado", f?.titulo ?? String(id));
  revalidatePath("/formularios");
  redirect("/formularios");
}

export async function guardarCatalogo(formData: FormData) {
  await exigirEdicao();
  const tipo = String(formData.get("tipo"));
  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const nome = String(formData.get("nome") ?? "").trim();
  const extra = String(formData.get("extra") ?? "").trim();
  const ordem = Number(formData.get("ordem") ?? 0);
  if (!nome) return;

  if (tipo === "patentes") {
    const row = {
      nome,
      abreviatura: extra || nome.slice(0, 4),
      ordem,
      categoria: String(formData.get("categoria") ?? "praca"),
      imagem: String(formData.get("imagem") ?? "").trim() || null,
    };
    if (id) await db.update(ranks).set(row).where(eq(ranks.id, id));
    else await db.insert(ranks).values(row);
  } else if (tipo === "cargos") {
    if (id) await db.update(positions).set({ nome, ordem }).where(eq(positions.id, id));
    else await db.insert(positions).values({ nome, ordem });
  } else if (tipo === "especialidades") {
    const row = { nome, abreviatura: extra || nome.slice(0, 3).toUpperCase(), ordem };
    if (id) await db.update(specialties).set(row).where(eq(specialties.id, id));
    else await db.insert(specialties).values(row);
  } else if (tipo === "estados") {
    const row = { nome, cor: extra || "#94a3b8", ordem };
    if (id) await db.update(statuses).set(row).where(eq(statuses.id, id));
    else await db.insert(statuses).values(row);
  } else if (tipo === "unidades") {
    const row = {
      nome,
      abreviatura: extra || null,
      descricao: String(formData.get("descricao") ?? "").trim() || null,
      ordem,
      rosterId: num(formData.get("rosterId")),
    };
    if (id) await db.update(units).set(row).where(eq(units.id, id));
    else await db.insert(units).values(row);
  } else if (tipo === "rosters") {
    const row = { nome, descricao: extra || null, ordem };
    if (id) await db.update(rosters).set(row).where(eq(rosters.id, id));
    else await db.insert(rosters).values(row);
  } else if (tipo === "condecoracoes") {
    const row = {
      nome,
      designacao: String(formData.get("designacao") ?? "").trim() || null,
      descricao: extra || null,
      imagem: String(formData.get("imagem") ?? "").trim() || null,
      ordem,
    };
    if (id) await db.update(awards).set(row).where(eq(awards.id, id));
    else await db.insert(awards).values(row);
  } else if (tipo === "qualificacoes") {
    const row = { nome, abreviatura: extra || null, ordem };
    if (id) await db.update(qualifications).set(row).where(eq(qualifications.id, id));
    else await db.insert(qualifications).values(row);
  }
  revalidatePath(`/admin/${tipo}`);
}

export async function apagarCatalogo(formData: FormData) {
  await exigirEdicao();
  const tipo = String(formData.get("tipo"));
  const id = Number(formData.get("id"));
  const table =
    tipo === "patentes"
      ? ranks
      : tipo === "cargos"
        ? positions
        : tipo === "especialidades"
          ? specialties
          : tipo === "estados"
            ? statuses
            : tipo === "unidades"
              ? units
              : tipo === "rosters"
                ? rosters
                : tipo === "condecoracoes"
                  ? awards
                  : qualifications;
  await db.delete(table).where(eq(table.id, id));
  revalidatePath(`/admin/${tipo}`);
}

export async function seleccionarServidor(formData: FormData) {
  await exigirSessao();
  const id = Number(formData.get("id"));
  const jar = await cookies();
  jar.set(COOKIE_SERVIDOR, String(id), { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/");
  revalidatePath("/estatisticas");
  revalidatePath("/servidor");
  const next = String(formData.get("next") ?? "/estatisticas");
  redirect(next.startsWith("/") ? next : "/estatisticas");
}

export async function guardarServidor(formData: FormData) {
  await exigirEdicao();
  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const row = {
    nome: String(formData.get("nome") ?? "Servidor"),
    tipo: String(formData.get("tipo") ?? "Arma 3"),
    endereco: String(formData.get("endereco") ?? "").trim() || null,
    porta: String(formData.get("porta") ?? "").trim() || null,
    password: String(formData.get("password") ?? "").trim() || null,
    modpack: String(formData.get("modpack") ?? "").trim() || null,
    notas: String(formData.get("notas") ?? "").trim() || null,
  };
  if (id) await db.update(servers).set(row).where(eq(servers.id, id));
  else await db.insert(servers).values(row);
  revalidatePath("/servidor");
}

export async function aprovarRegisto(formData: FormData) {
  const u = await exigirSessao();
  if (!eComando(u)) redirect("/sem-permissao");
  const id = Number(formData.get("id"));
  const role = String(formData.get("role") ?? "operador");
  await db.update(users).set({ contaEstado: "aprovada", role }).where(eq(users.id, id));
  revalidatePath("/admin/acessos");
}

export async function bloquearConta(formData: FormData) {
  const u = await exigirSessao();
  if (!eComando(u)) redirect("/sem-permissao");
  const id = Number(formData.get("id"));
  if (id === u.id) redirect("/admin/acessos?erro=1");
  await db.update(users).set({ contaEstado: "bloqueada" }).where(eq(users.id, id));
  revalidatePath("/admin/acessos");
}

export async function desbloquearConta(formData: FormData) {
  const u = await exigirSessao();
  if (!eComando(u)) redirect("/sem-permissao");
  const id = Number(formData.get("id"));
  await db.update(users).set({ contaEstado: "aprovada" }).where(eq(users.id, id));
  revalidatePath("/admin/acessos");
}

export async function alterarMinhaPassword(formData: FormData) {
  const u = await exigirSessao();
  const nova = String(formData.get("password") ?? "");
  if (nova.length < 6) redirect("/conta?erro=curta");
  await db.update(users).set({ passwordHash: hashPassword(nova) }).where(eq(users.id, u.id));
  redirect("/conta?ok=1");
}

export async function publicarFoto(formData: FormData) {
  const u = await exigirSessao();
  const titulo = String(formData.get("titulo") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!titulo || !url) redirect("/fotos?erro=campos");
  await db.insert(photos).values({
    titulo,
    descricao: String(formData.get("descricao") ?? "").trim() || null,
    url,
    album: String(formData.get("album") ?? "Geral").trim() || "Geral",
    autorId: u.id,
    serverId: (await servidorSeleccionado())?.id ?? null,
  });
  await log(u.nomeGuerra ?? u.nome, "Foto publicada", titulo);
  revalidatePath("/fotos");
  redirect("/fotos");
}

export async function marcarNotificacoesLidas() {
  const u = await exigirSessao();
  await db.update(notifications).set({ lida: true }).where(eq(notifications.userId, u.id));
}

export async function exigirCanalComando() {
  await exigirChatComando();
}

export async function podeMexer(role: string) {
  return podeEditar({ role });
}

export async function guardarAbasRole(formData: FormData) {
  const u = await exigirSessao();
  if (!eComando(u)) redirect("/sem-permissao");
  const role = String(formData.get("role") ?? "operador");
  const tabs = formData.getAll("tab").map(String);
  const existentes = await db.query.tabPermissions.findMany({ where: eq(tabPermissions.role, role) });
  for (const row of existentes) {
    await db.update(tabPermissions).set({ permitido: tabs.includes(row.tab) }).where(eq(tabPermissions.id, row.id));
  }
  for (const tab of tabs) {
    if (!existentes.some((e) => e.tab === tab)) {
      await db.insert(tabPermissions).values({ role, tab, permitido: true });
    }
  }
  revalidatePath("/admin/acessos");
  revalidatePath("/");
}

export async function guardarAbasUser(formData: FormData) {
  const u = await exigirSessao();
  if (!eComando(u)) redirect("/sem-permissao");
  const userId = Number(formData.get("userId"));
  const usarPadrao = formData.get("padrao") === "on";
  await db.delete(userTabPermissions).where(eq(userTabPermissions.userId, userId));
  if (!usarPadrao) {
    const tabs = formData.getAll("tab").map(String);
    if (tabs.length) {
      await db.insert(userTabPermissions).values(tabs.map((tab) => ({ userId, tab, permitido: true })));
    }
  }
  revalidatePath("/admin/acessos");
  revalidatePath("/");
}

function num(v: FormDataEntryValue | null) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}
