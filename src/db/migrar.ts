import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * DDL idempotente: cria tabelas que faltam e acrescenta colunas novas em BDs antigas.
 * Executado no arranque antes do seed, para a app se auto-reparar em qualquer BD.
 */
const DDL = [
  `CREATE TABLE IF NOT EXISTS ranks (
    id serial PRIMARY KEY,
    nome text NOT NULL,
    abreviatura text NOT NULL,
    ordem integer NOT NULL DEFAULT 0,
    imagem text,
    categoria text NOT NULL DEFAULT 'praca'
  )`,
  `ALTER TABLE ranks ADD COLUMN IF NOT EXISTS categoria text NOT NULL DEFAULT 'praca'`,
  `CREATE TABLE IF NOT EXISTS positions (
    id serial PRIMARY KEY,
    nome text NOT NULL,
    ordem integer NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS specialties (
    id serial PRIMARY KEY,
    nome text NOT NULL,
    abreviatura text NOT NULL,
    ordem integer NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS statuses (
    id serial PRIMARY KEY,
    nome text NOT NULL,
    cor text NOT NULL DEFAULT '#94a3b8',
    ordem integer NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS rosters (
    id serial PRIMARY KEY,
    nome text NOT NULL,
    descricao text,
    ordem integer NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS units (
    id serial PRIMARY KEY,
    nome text NOT NULL,
    abreviatura text,
    descricao text,
    roster_id integer REFERENCES rosters(id) ON DELETE SET NULL,
    ordem integer NOT NULL DEFAULT 0
  )`,
  `ALTER TABLE units ADD COLUMN IF NOT EXISTS descricao text`,
  `CREATE TABLE IF NOT EXISTS awards (
    id serial PRIMARY KEY,
    nome text NOT NULL,
    designacao text,
    descricao text,
    imagem text,
    ordem integer NOT NULL DEFAULT 0
  )`,
  `ALTER TABLE awards ADD COLUMN IF NOT EXISTS designacao text`,
  `CREATE TABLE IF NOT EXISTS qualifications (
    id serial PRIMARY KEY,
    nome text NOT NULL,
    abreviatura text,
    ordem integer NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id serial PRIMARY KEY,
    nome text NOT NULL,
    nome_guerra text,
    numero_servico text,
    discord text,
    steam text,
    bio text,
    foto text,
    login text,
    password_hash text,
    role text NOT NULL DEFAULT 'operador',
    conta_estado text NOT NULL DEFAULT 'aprovada',
    registo_notas text,
    rank_id integer REFERENCES ranks(id) ON DELETE SET NULL,
    position_id integer REFERENCES positions(id) ON DELETE SET NULL,
    specialty_id integer REFERENCES specialties(id) ON DELETE SET NULL,
    status_id integer REFERENCES statuses(id) ON DELETE SET NULL,
    unit_id integer REFERENCES units(id) ON DELETE SET NULL,
    server_id integer,
    data_alistamento timestamptz,
    ultimo_login timestamptz,
    criado_em timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS servers (
    id serial PRIMARY KEY,
    nome text NOT NULL,
    tipo text NOT NULL DEFAULT 'Arma 3',
    endereco text,
    porta text,
    password text,
    modpack text,
    notas text,
    ordem integer NOT NULL DEFAULT 0
  )`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS server_id integer REFERENCES servers(id) ON DELETE SET NULL`,
  `CREATE TABLE IF NOT EXISTS events (
    id serial PRIMARY KEY,
    titulo text NOT NULL,
    tipo text NOT NULL DEFAULT 'Treino',
    briefing text,
    local text,
    data_inicio timestamptz NOT NULL,
    data_fim timestamptz,
    obrigatorio boolean NOT NULL DEFAULT false,
    unit_id integer REFERENCES units(id) ON DELETE SET NULL,
    server_id integer REFERENCES servers(id) ON DELETE SET NULL,
    criado_em timestamptz NOT NULL DEFAULT now()
  )`,
  `ALTER TABLE events ADD COLUMN IF NOT EXISTS server_id integer REFERENCES servers(id) ON DELETE SET NULL`,
  `CREATE TABLE IF NOT EXISTS push_subscriptions (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    criado_em timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS app_settings (
    chave text PRIMARY KEY,
    valor text NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS server_status (
    server_id integer PRIMARY KEY REFERENCES servers(id) ON DELETE CASCADE,
    online boolean NOT NULL DEFAULT false,
    jogadores text,
    operadores text,
    actualizado_em timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS event_attendance (
    id serial PRIMARY KEY,
    event_id integer NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    estado text NOT NULL DEFAULT 'Presente'
  )`,
  `CREATE TABLE IF NOT EXISTS promotions (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rank_id integer REFERENCES ranks(id) ON DELETE SET NULL,
    data timestamptz NOT NULL DEFAULT now(),
    notas text
  )`,
  `CREATE TABLE IF NOT EXISTS user_awards (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    award_id integer NOT NULL REFERENCES awards(id) ON DELETE CASCADE,
    data timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS user_qualifications (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    qualification_id integer NOT NULL REFERENCES qualifications(id) ON DELETE CASCADE,
    data timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS combat_records (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    titulo text NOT NULL,
    descricao text,
    data timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS enlistment_applications (
    id serial PRIMARY KEY,
    nome text NOT NULL,
    nome_guerra text,
    discord text,
    idade text,
    experiencia text,
    motivacao text,
    status text NOT NULL DEFAULT 'Pendente',
    server_id integer REFERENCES servers(id) ON DELETE SET NULL,
    data timestamptz NOT NULL DEFAULT now()
  )`,
  `ALTER TABLE enlistment_applications ADD COLUMN IF NOT EXISTS server_id integer REFERENCES servers(id) ON DELETE SET NULL`,
  `CREATE TABLE IF NOT EXISTS documents (
    id serial PRIMARY KEY,
    titulo text NOT NULL,
    tipo text NOT NULL DEFAULT 'Certificado',
    corpo text NOT NULL,
    referencia text,
    criado_em timestamptz NOT NULL DEFAULT now()
  )`,
  `ALTER TABLE documents ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'Certificado'`,
  `ALTER TABLE documents ADD COLUMN IF NOT EXISTS referencia text`,
  `CREATE TABLE IF NOT EXISTS user_documents (
    id serial PRIMARY KEY,
    document_id integer NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    corpo text NOT NULL,
    numero text NOT NULL,
    emitido_por text,
    notas text,
    criado_em timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS forms (
    id serial PRIMARY KEY,
    titulo text NOT NULL,
    descricao text,
    campos text NOT NULL DEFAULT '[]',
    activo boolean NOT NULL DEFAULT true
  )`,
  `CREATE TABLE IF NOT EXISTS audit_log (
    id serial PRIMARY KEY,
    actor text,
    accao text NOT NULL,
    detalhe text,
    criado_em timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS notices (
    id serial PRIMARY KEY,
    titulo text NOT NULL,
    corpo text NOT NULL,
    autor text,
    criado_em timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    titulo text NOT NULL,
    corpo text,
    href text,
    tipo text NOT NULL DEFAULT 'evento',
    lida boolean NOT NULL DEFAULT false,
    criado_em timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS photos (
    id serial PRIMARY KEY,
    titulo text NOT NULL,
    descricao text,
    url text NOT NULL,
    album text NOT NULL DEFAULT 'Geral',
    autor_id integer REFERENCES users(id) ON DELETE SET NULL,
    server_id integer REFERENCES servers(id) ON DELETE SET NULL,
    criado_em timestamptz NOT NULL DEFAULT now()
  )`,
  `ALTER TABLE photos ADD COLUMN IF NOT EXISTS server_id integer REFERENCES servers(id) ON DELETE SET NULL`,
  `CREATE TABLE IF NOT EXISTS tab_permissions (
    id serial PRIMARY KEY,
    role text NOT NULL,
    tab text NOT NULL,
    permitido boolean NOT NULL DEFAULT true
  )`,
  `CREATE TABLE IF NOT EXISTS user_tab_permissions (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tab text NOT NULL,
    permitido boolean NOT NULL DEFAULT true
  )`,
  `CREATE TABLE IF NOT EXISTS chat_messages (
    id serial PRIMARY KEY,
    canal text NOT NULL,
    texto text NOT NULL,
    foto text,
    destino_id integer REFERENCES users(id) ON DELETE CASCADE,
    autor_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    criado_em timestamptz NOT NULL DEFAULT now()
  )`,
  `ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS foto text`,
  `ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS destino_id integer REFERENCES users(id) ON DELETE CASCADE`,
];

let pronto: Promise<void> | null = null;

/** Corre todo o DDL idempotente uma vez por processo. */
export function garantirEsquema(): Promise<void> {
  if (!pronto) {
    pronto = (async () => {
      for (const stmt of DDL) {
        try {
          await db.execute(sql.raw(stmt));
        } catch (err) {
          console.error("DDL falhou:", stmt.slice(0, 60), err instanceof Error ? err.message : err);
        }
      }
    })();
  }
  return pronto;
}
