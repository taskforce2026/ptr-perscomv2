# PTR PERSCOM — Phoenix Taskforce Rangers

Sistema de Gestão de Pessoal (PERSCOM) da comunidade portuguesa de Arma 3 **Phoenix Taskforce Rangers**. Aplicação web instalável (PWA) em português.

## Funcionalidades

| Área | Descrição |
| --- | --- |
| **Painel** | Efectivo, eventos, QR de acesso rápido à app, servidores online |
| **Pessoal** | Perfis completos com patentes (insígnias EP), condecorações, qualificações, documentos e edição/apagar operador |
| **Rosters** | Ordem de batalha com adicionar/editar/apagar de listas e unidades |
| **Eventos** | Calendário com presenças; criação gera **notificação push** com detalhes a todo o efectivo |
| **Estatísticas** | Por servidor seleccionado e período: presença, promoções, condecorações, online agora |
| **Servidores** | Adicionar/editar servidores Arma 3; monitor liga a `:2306` e cruza o **nome de guerra** dos jogadores com o efectivo |
| **Holograma** | Projecção táctica 3D de todo o efectivo |
| **Fotos** | Galeria por álbum, apagar as tuas publicações (Comando apaga qualquer uma) |
| **Chats** | Canal de operadores + canal de comando/oficiais; **conversa privada** com operador, **anexar fotografias**, **apagar mensagens** e **push a cada mensagem** |
| **Documentos** | Modelos CONFIDENTIAIS com logótipo PTR: criar/editar/apagar, emissão com **PDF e PNG**, geradores rápidos no perfil (alistamento, condecoração, qualificação, promoção) |
| **Condecorações** | Catálogo de medalhas legíveis; atribuir/remover no perfil do operador |
| **Acessos** | O Comando controla as abas visíveis por perfil e por militar |
| **Instalar App** | QR bem estruturado para **Android, iOS e PC** |

## Executar localmente

Requisitos: Node.js 20+ e PostgreSQL 14+.

```bash
npm install
cp .env.example .env   # preenche DATABASE_URL
npm run dev            # http://localhost:3000
```

No primeiro arranque a app **cria/repara as tabelas, semeia os dados e cria a conta de comando** automaticamente.

- Login comando: `*******` (password `*******` ou `*********`)
- Operador de exemplo: `******` / `******`

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | Sim | Ligação PostgreSQL |
| `AUTH_SECRET` | Recomendado | Segredo das sessões |
| `COMANDO_PASSWORD` | Recomendado | Password da conta comando |
| `NEXT_PUBLIC_APP_URL` | Recomendado | Endereço público (QR, push) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Não | Geradas e guardadas automaticamente |

## Publicar

Vercel + Neon (gratuito), Render ou Railway: carrega o repositório, aponta `DATABASE_URL` para a BD e define as variáveis acima. A app cria as tabelas no primeiro arranque.

## Estrutura

```
src/
├── app/            Rotas (app autenticada + login/registo/alistamento + API)
├── components/     UI, navegação, chat, gráficos, documentos, push
├── db/             Esquema Drizzle, seed, migração idempotente
└── lib/            Auth, acções, estatísticas, push, QR, monitor de servidores
public/             Emblema, insígnias de patente, medalhas, service worker
```

## Licença

Uso interno da comunidade Phoenix Taskforce Rangers.
