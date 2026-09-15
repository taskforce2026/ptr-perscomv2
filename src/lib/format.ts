export function nomeCompleto(u: { nome: string; nomeGuerra?: string | null }) {
  return u.nomeGuerra ? `${u.nome} “${u.nomeGuerra}”` : u.nome;
}

export function fmtData(d?: Date | string | null) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtDataHora(d?: Date | string | null) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtHora(d?: Date | string | null) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

export const NOMES_MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function isoLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function grelhaMes(ano: number, mes1: number) {
  const primeiro = new Date(ano, mes1 - 1, 1);
  const offset = (primeiro.getDay() + 6) % 7;
  const diasNoMes = new Date(ano, mes1, 0).getDate();
  const cells: { dia: number; iso: string; doMes: boolean }[] = [];
  for (let i = 0; i < offset; i++) {
    const d = new Date(ano, mes1 - 1, 1 - (offset - i));
    cells.push({ dia: d.getDate(), iso: isoLocal(d), doMes: false });
  }
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const d = new Date(ano, mes1 - 1, dia);
    cells.push({ dia, iso: isoLocal(d), doMes: true });
  }
  while (cells.length % 7 !== 0) {
    const last = new Date(ano, mes1 - 1, diasNoMes + (cells.length - offset - diasNoMes) + 1);
    cells.push({ dia: last.getDate(), iso: isoLocal(last), doMes: false });
  }
  return cells;
}

export const COR_TIPO: Record<string, string> = {
  Treino: "#3b82f6",
  Missão: "#ef4444",
  Operação: "#f59e0b",
  Reunião: "#38bdf8",
};

export function corTipo(tipo: string) {
  return COR_TIPO[tipo] ?? "#d4b45a";
}

export function iconeTipo(tipo: string) {
  switch (tipo) {
    case "Missão":
      return "⚔️";
    case "Operação":
      return "🎯";
    case "Reunião":
      return "📋";
    default:
      return "📅";
  }
}
