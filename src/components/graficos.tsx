import Link from "next/link";

export function Donut({
  dados,
}: {
  dados: { nome: string; n: number; cor?: string }[];
}) {
  const limpos = dados.filter((d) => d.n > 0);
  const total = limpos.reduce((s, d) => s + d.n, 0);
  const r = 54;
  const c = 2 * Math.PI * r;
  let acc = 0;
  const cores = ["#22c55e", "#3b82f6", "#eab308", "#ef4444", "#a855f7", "#14b8a6"];

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <svg viewBox="0 0 140 140" className="h-40 w-40 shrink-0">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="16" />
        {total > 0 &&
          limpos.map((d, i) => {
            const frac = d.n / total;
            const dash = frac * c;
            const gap = c - dash;
            const rot = (acc / total) * 360 - 90;
            acc += d.n;
            return (
              <circle
                key={d.nome}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={d.cor || cores[i % cores.length]}
                strokeWidth="16"
                strokeDasharray={`${dash} ${gap}`}
                strokeLinecap="butt"
                transform={`rotate(${rot} 70 70)`}
              />
            );
          })}
        <text x="70" y="66" textAnchor="middle" className="fill-gold-300" fontSize="22" fontWeight="800">
          {total}
        </text>
        <text x="70" y="84" textAnchor="middle" fill="#94a3b8" fontSize="9" letterSpacing="1.5">
          TOTAL
        </text>
      </svg>
      <ul className="w-full space-y-1.5 text-sm">
        {limpos.length === 0 && <li className="text-slate-500">Sem dados no período.</li>}
        {limpos.map((d, i) => (
          <li key={d.nome} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.cor || cores[i % cores.length] }} />
            <span className="flex-1 text-slate-300">{d.nome}</span>
            <span className="text-slate-400">
              {d.n}
              {total ? ` · ${Math.round((d.n / total) * 100)}%` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BarrasHorizontais({
  dados,
  cor,
  maxItens = 12,
}: {
  dados: { nome: string; n: number }[];
  cor: string;
  maxItens?: number;
}) {
  const lista = dados.filter((d) => d.n >= 0).slice(0, maxItens);
  const max = Math.max(...lista.map((d) => d.n), 1);
  if (lista.length === 0) return <p className="text-sm text-slate-500">Sem dados.</p>;
  return (
    <ul className="space-y-2.5">
      {lista.map((d) => (
        <li key={d.nome}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate text-slate-200">{d.nome}</span>
            <span className="text-gold-300">{d.n}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full" style={{ width: `${(d.n / max) * 100}%`, background: cor }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ColunasMensais({
  rotulos,
  series,
}: {
  rotulos: string[];
  series: { nome: string; valores: number[]; cor: string }[];
}) {
  const max = Math.max(1, ...series.flatMap((s) => s.valores));
  const n = rotulos.length;
  return (
    <div>
      <div className="flex h-40 items-end gap-1.5">
        {rotulos.map((r, i) => (
          <div key={`${r}-${i}`} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-32 w-full items-end justify-center gap-px">
              {series.map((s) => {
                const v = s.valores[i] ?? 0;
                const h = Math.max(v > 0 ? 8 : 0, (v / max) * 120);
                return (
                  <div
                    key={s.nome}
                    title={`${s.nome}: ${v}`}
                    className="w-full max-w-[10px] rounded-t-sm"
                    style={{ height: h, background: s.cor, opacity: v ? 1 : 0.15 }}
                  />
                );
              })}
            </div>
            <span className="text-[9px] uppercase text-slate-500">{r}</span>
          </div>
        ))}
        {n === 0 && <p className="text-sm text-slate-500">Sem actividade.</p>}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-400">
        {series.map((s) => (
          <span key={s.nome} className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm" style={{ background: s.cor }} />
            {s.nome}
          </span>
        ))}
      </div>
    </div>
  );
}

export function LinhaMensal({
  rotulos,
  valores,
  cor,
}: {
  rotulos: string[];
  valores: number[];
  cor: string;
}) {
  const w = 320;
  const h = 120;
  const pad = 12;
  const max = Math.max(1, ...valores);
  const pts = valores.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / Math.max(valores.length - 1, 1);
    const y = h - pad - (v / max) * (h - pad * 2);
    return { x, y, v };
  });
  const line = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full">
        <polygon points={area} fill={cor} opacity="0.18" />
        <polyline points={line} fill="none" stroke={cor} strokeWidth="2.5" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={cor} />
        ))}
        {pts.map((p, i) =>
          p.v > 0 ? (
            <text key={`t-${i}`} x={p.x} y={p.y - 8} textAnchor="middle" fill={cor} fontSize="9">
              {p.v}
            </text>
          ) : null,
        )}
      </svg>
      <div className="flex justify-between text-[9px] uppercase text-slate-500">
        {rotulos.map((r, i) => (
          <span key={`${r}-${i}`}>{r}</span>
        ))}
      </div>
    </div>
  );
}

export function Progresso({ valor }: { valor: number }) {
  const v = Math.max(0, Math.min(100, valor));
  const cor = v >= 75 ? "#22c55e" : v >= 50 ? "#eab308" : "#ef4444";
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-xs">
        <span className="font-bold" style={{ color: cor }}>
          {v}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${v}%`, background: cor }} />
      </div>
    </div>
  );
}

export function CartaoEstat({
  icone,
  valor,
  etiqueta,
  href,
}: {
  icone: string;
  valor: number | string;
  etiqueta: string;
  href?: string;
}) {
  const inner = (
    <div className="panel flex items-center gap-3 rounded-2xl p-4">
      <span className="text-3xl leading-none">{icone}</span>
      <div>
        <div className="text-3xl font-black leading-none text-gold-200">{valor}</div>
        <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{etiqueta}</div>
      </div>
    </div>
  );
  if (!href) return inner;
  return <Link href={href}>{inner}</Link>;
}
