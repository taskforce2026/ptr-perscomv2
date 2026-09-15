export const TIPOS_DOCUMENTO = [
  "Certificado",
  "Missão",
  "Treino",
  "Ordem",
  "Briefing",
  "Nomeação",
  "Declaração",
  "Relatório",
] as const;

export function preencherModelo(corpo: string, dados: Record<string, string>) {
  return corpo.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, chave: string) => dados[chave] ?? `{{${chave}}}`);
}

export function numeroDocumento(tipo: string, id: number) {
  const ano = new Date().getFullYear();
  const prefixo: Record<string, string> = {
    Certificado: "CERT",
    Missão: "OPORD",
    Treino: "TRN",
    Ordem: "ORD",
    Briefing: "BRF",
    Nomeação: "NOM",
    Declaração: "DECL",
    Relatório: "AAR",
  };
  return `PTR-${prefixo[tipo] ?? "DOC"}-${ano}-${String(id).padStart(4, "0")}`;
}

export const MODELOS_PADRAO: { titulo: string; tipo: string; referencia: string; corpo: string }[] = [
  {
    titulo: "Certificado de Alistamento",
    tipo: "Certificado",
    referencia: "PTR-CERT-ALIST",
    corpo: `PHOENIX TASKFORCE RANGERS
ORDEM DE SERVIÇO — ALISTAMENTO

Por determinação do Comando da Taskforce, fica alistado(a) no efectivo da PTR o(a) militar {{nome}} “{{nomeGuerra}}” ({{nservico}}), com efeitos a {{data}}.

Patente: {{patente}}
Unidade: {{unidade}}
Cargo: {{cargo}}

O presente documento reconhece a integração do militar no Sistema de Gestão de Pessoal (PERSCOM) e no espírito de corpo da Phoenix Taskforce Rangers.

O Comandante da Taskforce`,
  },
  {
    titulo: "Certificado de Condecoração",
    tipo: "Certificado",
    referencia: "PTR-CERT-COND",
    corpo: `PHOENIX TASKFORCE RANGERS
ORDEM DE SERVIÇO — CONDECORAÇÃO

Por determinação do Comando da Taskforce, é condecorado(a) o(a) militar {{patente}} {{nome}} “{{nomeGuerra}}” ({{nservico}}) com:

{{qualificacao}}

Unidade: {{unidade}}
Data: {{data}}

A presente condecoração reconhece a dedicação, competência e espírito de corpo demonstrados ao serviço da PTR.

O Comandante da Taskforce`,
  },
  {
    titulo: "Certificado de Qualificação",
    tipo: "Certificado",
    referencia: "PTR-CERT-QUAL",
    corpo: `O COMANDO DA PHOENIX TASKFORCE RANGERS certifica que o militar

{{patente}} {{nome}} “{{nomeGuerra}}”
N.º de serviço: {{nservico}}
Unidade: {{unidade}}

concluiu com aproveitamento a qualificação / curso indicado, demonstrando competência táctica, disciplina e espírito de corpo próprios da PTR.

Qualificação: {{qualificacao}}
Data de emissão: {{data}}

O presente certificado é documento oficial da unidade e destina-se ao processo individual do militar.`,
  },
  {
    titulo: "Ordem de Missão",
    tipo: "Missão",
    referencia: "PTR-OPORD",
    corpo: `ORDEM DE MISSÃO

Para: {{patente}} {{nome}} “{{nomeGuerra}}”
Unidade: {{unidade}} · N.º {{nservico}}

1. SITUAÇÃO
A PTR executa operação no quadro das missões da unidade.

2. MISSÃO
{{missao}}

3. EXECUÇÃO
O militar acima identificado fica destacado para a missão na data de {{data}}, sob comando da cadeia orgânica.

4. ADMINISTRAÇÃO E LOGÍSTICA
Equipamento conforme SOP da unidade. Briefing no horário definido pelo Comando.

5. COMANDO E TRANSMISSÕES
Frequências e palavras-de-passe conforme anexo classificado.

Esta ordem tem carácter CONFIDENCIAL.`,
  },
  {
    titulo: "Ordem de Treino",
    tipo: "Treino",
    referencia: "PTR-TRN",
    corpo: `ORDEM DE TREINO

Militar: {{patente}} {{nome}} “{{nomeGuerra}}”
Unidade: {{unidade}}

Fica convocado para o treino de {{treino}} a realizar em {{data}}.

Objectivos:
— Aperfeiçoar procedimentos tácticos da PTR
— Avaliar assiduidade e desempenho individual
— Preparar o efectivo para operações futuras

Presença {{obrigatoriedade}}. Fardamento e equipamento conforme SOP.

O Comando da Phoenix Taskforce Rangers.`,
  },
  {
    titulo: "Certificado de Participação em Operação",
    tipo: "Certificado",
    referencia: "PTR-CERT-OP",
    corpo: `CERTIFICADO DE PARTICIPAÇÃO EM OPERAÇÃO

Certifica-se que {{patente}} {{nome}} “{{nomeGuerra}}”, n.º {{nservico}}, da unidade {{unidade}}, participou na operação:

{{operacao}}

Data: {{data}}

O militar cumpriu as suas funções com disciplina e profissionalismo, honrando o emblema da Phoenix Taskforce Rangers.

Emitido pelo Comando da PTR.`,
  },
  {
    titulo: "Briefing de Missão",
    tipo: "Briefing",
    referencia: "PTR-BRF",
    corpo: `BRIEFING DE MISSÃO — CONFIDENCIAL

Destinatário: {{patente}} {{nome}} “{{nomeGuerra}}”
Unidade: {{unidade}}
Data: {{data}}

I. TERRENO E INIMIGO
{{terreno}}

II. INTENÇÃO DO COMANDANTE
{{intencao}}

III. TAREFAS
{{tarefas}}

IV. COORDENAÇÃO
Hora H, pontos de encontro e extração conforme anexo.

V. REGRAS DE EMPENGAMENTO
Conforme SOP PTR e briefing verbal.

Destruir após leitura se em suporte físico não controlado.`,
  },
  {
    titulo: "Nomeação de Cargo",
    tipo: "Nomeação",
    referencia: "PTR-NOM",
    corpo: `DESPACHO DE NOMEAÇÃO

O Comando da Phoenix Taskforce Rangers nomeia:

{{patente}} {{nome}} “{{nomeGuerra}}”
N.º {{nservico}} · {{unidade}}

para o cargo de:

{{cargo}}

com efeitos a {{data}}.

O militar assume as responsabilidades, deveres e autoridade inerentes ao cargo, respondendo perante a cadeia de comando.

O Comandante da Taskforce.`,
  },
  {
    titulo: "Certificado de Conclusão de Curso",
    tipo: "Certificado",
    referencia: "PTR-CERT-CURSO",
    corpo: `CERTIFICADO DE CONCLUSÃO DE CURSO

A Phoenix Taskforce Rangers certifica que

{{patente}} {{nome}} “{{nomeGuerra}}”

frequentou e concluiu o curso:

{{curso}}

com a classificação de {{classificacao}}, em {{data}}.

Este documento faz parte do processo individual do militar.`,
  },
  {
    titulo: "Ordem de Promoção",
    tipo: "Ordem",
    referencia: "PTR-ORD-PROM",
    corpo: `PHOENIX TASKFORCE RANGERS
ORDEM DE SERVIÇO — PROMOÇÃO

Por determinação do Comando da Taskforce, é promovido(a) ao posto de {{novaPatente}} o(a) militar {{nome}} “{{nomeGuerra}}” ({{nservico}}), com efeitos a partir de {{data}}.

Unidade: {{unidade}}
Patente anterior: {{patente}}

A presente promoção reconhece a dedicação, competência e espírito de corpo demonstrados ao serviço da PTR.

{{unidade}}
O Comandante da Taskforce`,
  },
  {
    titulo: "Declaração de Serviço",
    tipo: "Declaração",
    referencia: "PTR-DECL",
    corpo: `DECLARAÇÃO DE SERVIÇO

Se declara, para os devidos efeitos, que {{patente}} {{nome}} “{{nomeGuerra}}”, n.º de serviço {{nservico}}, se encontra no efectivo da Phoenix Taskforce Rangers, unidade {{unidade}}, no estado de {{estado}}.

Alistamento: {{alistamento}}
Data da declaração: {{data}}

Documento emitido a pedido do interessado / Comando.`,
  },
  {
    titulo: "Relatório Após-Acção (AAR)",
    tipo: "Relatório",
    referencia: "PTR-AAR",
    corpo: `RELATÓRIO APÓS-ACÇÃO

Militar relator: {{patente}} {{nome}} “{{nomeGuerra}}”
Unidade: {{unidade}}
Data: {{data}}
Operação / treino: {{operacao}}

1. O QUE ESTAVA PLANEADO
{{planeado}}

2. O QUE ACONTECEU
{{aconteceu}}

3. LIÇÕES APRENDIDAS
{{licoes}}

4. RECOMENDAÇÕES
{{recomendacoes}}

Classificação: CONFIDENCIAL — uso interno PTR.`,
  },
  {
    titulo: "Convocatória de Reunião de Comando",
    tipo: "Ordem",
    referencia: "PTR-ORD-REUN",
    corpo: `CONVOCATÓRIA

É convocado o militar {{patente}} {{nome}} “{{nomeGuerra}}” para reunião de comando em {{data}}.

Ordem de trabalhos:
{{ordemTrabalhos}}

Presença obrigatória. Farda de serviço. Pontualidade.

O Comando da PTR.`,
  },
  {
    titulo: "Certificado de Assiduidade",
    tipo: "Certificado",
    referencia: "PTR-CERT-ASSID",
    corpo: `CERTIFICADO DE ASSIDUIDADE

O Comando da Phoenix Taskforce Rangers reconhece a assiduidade exemplar de

{{patente}} {{nome}} “{{nomeGuerra}}”
Unidade {{unidade}}

no período indicado, com presença regular em treinos e missões da unidade.

Data: {{data}}

Este certificado pode ser averbado ao processo individual.`,
  },
];
