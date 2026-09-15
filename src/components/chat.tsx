"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type Msg = {
  id: number;
  texto: string;
  foto: string | null;
  criadoEm: string;
  autor: {
    id: number;
    nome: string;
    nomeGuerra: string | null;
    foto: string | null;
    rank: { abreviatura: string } | null;
  };
};

type Operador = {
  id: number;
  nome: string;
  nomeGuerra: string | null;
  abrev: string | null;
};

const MAX_FOTO = 3 * 1024 * 1024; // ~3 MB

export function ChatBox({
  canal,
  titulo,
  subtitulo,
  meId,
  canModerate,
  operadores,
}: {
  canal: "operadores" | "comando";
  titulo: string;
  subtitulo: string;
  meId: number;
  canModerate: boolean;
  operadores: Operador[];
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [mostrarAnexo, setMostrarAnexo] = useState(false);
  const [destino, setDestino] = useState<number | null>(null);
  const fim = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const destinoInfo = operadores.find((o) => o.id === destino) ?? null;

  async function carregar() {
    const q = destino ? `&destino=${destino}` : "";
    const r = await fetch(`/api/chat?canal=${canal}${q}`, { cache: "no-store" });
    if (!r.ok) return;
    const data = (await r.json()) as { mensagens: Msg[] };
    setMsgs(data.mensagens);
  }

  useEffect(() => {
    void carregar();
    const t = setInterval(() => void carregar(), 2500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canal, destino]);

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  function anexarFicheiro(f: File) {
    setErro("");
    if (!f.type.startsWith("image/")) {
      setErro("Escolhe um ficheiro de imagem (JPG ou PNG).");
      return;
    }
    if (f.size > MAX_FOTO) {
      setErro("Foto demasiado grande (máx. ~3 MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFotoPreview(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => setErro("Não foi possível ler o ficheiro.");
    reader.readAsDataURL(f);
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!texto.trim() && !fotoPreview) return;
    setErro("");
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canal, texto, foto: fotoPreview, destinoId: destino }),
    });
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { erro?: string };
      setErro(j.erro ?? "Não foi possível enviar.");
      return;
    }
    setTexto("");
    setFotoPreview(null);
    setMostrarAnexo(false);
    if (fileRef.current) fileRef.current.value = "";
    await carregar();
  }

  async function apagar(id: number) {
    setErro("");
    const r = await fetch(`/api/chat?id=${id}`, { method: "DELETE" });
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { erro?: string };
      setErro(j.erro === "permissao" ? "Não tens permissão para apagar esta mensagem." : "Não foi possível apagar.");
      return;
    }
    await carregar();
  }

  const ultima = msgs[msgs.length - 1];
  const ultimaEhMia = !!ultima && ultima.autor.id === meId;

  return (
    <div className="flex h-[calc(100vh-11rem)] flex-col lg:h-[calc(100vh-8rem)]">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-gold-300">
            {titulo}
            {destinoInfo ? (
              <span className="ml-2 text-base font-normal text-emerald-300">· Privado com {destinoInfo.nomeGuerra ?? destinoInfo.nome}</span>
            ) : (
              <span className="ml-2 text-base font-normal text-slate-500">· Canal geral</span>
            )}
          </h1>
          <p className="text-sm text-slate-400">{subtitulo}</p>
        </div>
        <label className="text-right text-xs text-slate-500">
          Falar com
          <select
            className="input ml-2 !w-auto !py-1 text-xs"
            value={destino ?? ""}
            onChange={(e) => setDestino(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">👥 Canal geral (todos)</option>
            {operadores
              .filter((o) => o.id !== meId)
              .map((o) => (
                <option key={o.id} value={o.id}>
                  💬 {o.abrev ? `${o.abrev} ` : ""}
                  {o.nomeGuerra ?? o.nome}
                </option>
              ))}
          </select>
        </label>
      </div>
      <div className="panel flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {msgs.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">
              {destino ? "Inicia a conversa privada." : "Sem mensagens no canal."}
            </p>
          )}
          {msgs.map((m) => {
            const meu = m.autor.id === meId;
            const podeApagar = meu || canModerate;
            return (
              <div key={m.id} className={`group flex gap-3 ${meu ? "flex-row-reverse" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.autor.foto || "/emblema.png"}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover ring-1 ring-gold-500/30"
                />
                <div className={`relative max-w-[80%] rounded-2xl px-3 py-2 ${meu ? "bg-gold-500/20 text-gold-50" : "bg-white/5"}`}>
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-gold-400">
                    <span>
                      {m.autor.rank?.abreviatura} {m.autor.nomeGuerra ?? m.autor.nome}
                    </span>
                    {podeApagar && (
                      <button
                        onClick={() => void apagar(m.id)}
                        title="Apagar mensagem"
                        className="rounded p-0.5 text-xs text-slate-500 transition hover:text-red-300"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                  {m.foto && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.foto} alt="Anexo" className="mt-1 max-h-64 w-full rounded-lg border border-white/10 object-cover" />
                  )}
                  {m.texto && <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.texto}</div>}
                  <div className="mt-1 text-[10px] text-slate-500">
                    {new Date(m.criadoEm).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={fim} />
        </div>

        {fotoPreview && (
          <div className="flex items-center gap-3 border-t border-gold-500/15 bg-black/30 px-3 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fotoPreview} alt="Pré-visualização" className="h-14 w-14 rounded-lg border border-gold-500/30 object-cover" />
            <div className="flex-1 text-xs text-slate-400">Foto pronta a enviar.</div>
            <button
              type="button"
              className="btn btn-danger !px-2 !py-1 text-xs"
              onClick={() => {
                setFotoPreview(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              Remover
            </button>
          </div>
        )}

        {mostrarAnexo && (
          <div className="flex flex-wrap items-center gap-2 border-t border-gold-500/15 bg-black/30 px-3 py-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && anexarFicheiro(e.target.files[0])}
            />
            <button type="button" className="btn btn-secondary !py-1 text-xs" onClick={() => fileRef.current?.click()}>
              📷 Carregar foto do dispositivo
            </button>
            <input
              className="input !py-1 text-xs"
              placeholder="…ou cola a URL da imagem"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const v = e.currentTarget.value;
                  if (v.trim()) setFotoPreview(v.trim());
                }
              }}
            />
          </div>
        )}

        <form onSubmit={enviar} className="flex flex-wrap gap-2 border-t border-gold-500/15 p-3">
          <button
            type="button"
            onClick={() => setMostrarAnexo((v) => !v)}
            className={`btn ${mostrarAnexo ? "btn-primary" : "btn-ghost"} !px-3`}
            title="Acrescentar fotografia"
          >
            🖼
          </button>
          {ultimaEhMia && (
            <button
              type="button"
              className="rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-300 transition hover:bg-red-500/20"
              title="Apagar a última mensagem que enviaste"
              onClick={() => void apagar(ultima.id)}
            >
              ✕ última
            </button>
          )}
          <input
            className="input min-w-0 flex-1"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={destino ? `Mensagem privada para ${destinoInfo?.nomeGuerra ?? destinoInfo?.nome}…` : "Escrever mensagem…"}
            maxLength={2000}
          />
          <button className="btn btn-primary" type="submit">
            Enviar
          </button>
        </form>
        {erro && <p className="px-3 pb-3 text-xs text-red-300">{erro}</p>}
      </div>
    </div>
  );
}
