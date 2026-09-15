export function Insignia({
  rank,
  size = 28,
  mostrarSigla = false,
}: {
  rank?: { nome: string; abreviatura: string; imagem: string | null } | null;
  size?: number;
  mostrarSigla?: boolean;
}) {
  if (!rank) {
    return <span className="text-xs text-slate-500">—</span>;
  }
  return (
    <span className="inline-flex items-center gap-2">
      {rank.imagem ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={rank.imagem} alt={rank.nome} width={size} height={size} className="object-contain drop-shadow" />
      ) : (
        <span className="grid h-7 w-7 place-items-center rounded bg-gold-500/15 text-[10px] font-bold text-gold-300">
          {rank.abreviatura}
        </span>
      )}
      {mostrarSigla && <span className="text-gold-400 font-semibold">{rank.abreviatura}</span>}
    </span>
  );
}

export function Medalha({
  award,
  size = 36,
  mostrarNome = true,
}: {
  award: { nome: string; imagem: string | null; designacao?: string | null };
  size?: number;
  mostrarNome?: boolean;
}) {
  const titulo = award.designacao || award.nome;
  return (
    <span className="inline-flex flex-col items-center gap-1" title={titulo}>
      {award.imagem ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={award.imagem} alt={titulo} width={size} height={size} className="object-contain" />
      ) : (
        <span className="text-2xl">🏅</span>
      )}
      {mostrarNome && (
        <span className="max-w-[110px] text-center text-[10px] leading-tight text-slate-400">
          {titulo}
        </span>
      )}
    </span>
  );
}
