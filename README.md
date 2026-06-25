# ASCEND

**Consistência que transforma** — plataforma de produtividade e evolução pessoal.

Monorepo com app mobile (Expo) e API REST (NestJS). O mobile comunica **apenas com a API**; a API persiste dados no PostgreSQL do Supabase via Prisma.

Para contexto de produto, roadmap e escopo do MVP, veja [`.specs/project/PROJECT.md`](.specs/project/PROJECT.md).

---

## Tech stack

| Camada | Tecnologia |
| ------ | ---------- |
| Mobile | React Native, Expo SDK 54, Expo Router, NativeWind |
| API | NestJS, Prisma 6 |
| Banco | PostgreSQL (Supabase) |
| Data fetching | TanStack React Query |
| Tooling | npm workspaces, TypeScript, ESLint, Prettier |

---

## Estrutura do repositório

```
.
├── apps/
│   ├── api/                 # NestJS + Prisma
│   │   ├── prisma/          # schema e migrations
│   │   └── src/             # módulos (config, health, prisma, …)
│   └── mobile/              # Expo Router + NativeWind
│       ├── app/             # rotas (tabs: Dashboard, Áreas, Objetivos, Perfil)
│       ├── components/
│       └── lib/             # API client, React Query
├── .github/workflows/       # CI (lint + build)
├── .specs/                  # especificações e design do projeto
└── package.json             # scripts root (dev, build, lint)
```

---

## Pré-requisitos

- **Node.js 20.19.4+** — use `nvm use` (`.nvmrc` na raiz) ou instale via [nodejs.org](https://nodejs.org/)
- **npm** (vem com o Node)
- **Git**
- **Conta Supabase** — [supabase.com](https://supabase.com) (plano gratuito basta para dev)
- **Expo Go** no celular com **SDK 54** (App Store / Play Store), ou emulador iOS/Android
- **Windows:** os scripts funcionam em Git Bash e PowerShell

---

## Setup local

### 1. Clone e instale dependências

```bash
git clone <repo-url> ascend
cd ascend
npm install
```

### 2. Configure variáveis de ambiente

```bash
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
```

#### API — Supabase (`apps/api/.env`)

1. Abra o [Supabase Dashboard](https://supabase.com/dashboard) → seu projeto → **Connect**.
2. Em **Connection string**, copie as URLs:
   - **Transaction pooler** (porta **6543**) → `DATABASE_URL` — usada em runtime pela API
   - **Session / Direct** (porta **5432**) → `DIRECT_URL` — usada pelo Prisma em migrations

Substitua `[password]` pela senha do banco (definida na criação do projeto).

Exemplo (valores fictícios):

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres.abcdef:SUASENHA@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.abcdef:SUASENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
```

> Se o projeto Supabase estiver **pausado** (inativo), restaure-o no dashboard antes de migrar ou subir a API.

#### Mobile — URL da API (`apps/mobile/.env`)

| Ambiente | `EXPO_PUBLIC_API_URL` |
| -------- | --------------------- |
| iOS Simulator / Web | `http://localhost:3000` |
| Android Emulator | `http://10.0.2.2:3000` |
| Dispositivo físico (mesma rede Wi‑Fi) | `http://<SEU-IP-LAN>:3000` |

Para descobrir seu IP na LAN:

- **Windows:** `ipconfig` → IPv4 da interface Wi‑Fi/Ethernet
- **macOS/Linux:** `ip addr` ou `ifconfig`

Reinicie o Expo após alterar `.env` (`npx expo start -c`).

### 3. Rode as migrations

```bash
npm run db:migrate -w api
```

Isso aplica o schema Prisma (11 tabelas MVP) no banco Supabase.

### 4. Inicie o ambiente de desenvolvimento

```bash
npm run dev
```

Isso sobe API e mobile em paralelo. Alternativas:

```bash
npm run dev:api      # só a API (porta 3000)
npm run dev:mobile   # só o Expo
```

### 5. Verifique

**API:**

```bash
curl http://localhost:3000/health
```

Resposta esperada (HTTP 200):

```json
{
  "status": "ok",
  "timestamp": "...",
  "database": "connected"
}
```

**Mobile:**

1. Abra o Expo Go (ou emulador) e escaneie o QR code.
2. Navegue pelas 4 abas: **Dashboard**, **Áreas**, **Objetivos**, **Perfil**.
3. No Dashboard, confira o status **API conectada** (verde) com a API rodando.

---

## Scripts disponíveis

### Raiz

| Script | Descrição |
| ------ | --------- |
| `npm run dev` | API + mobile em paralelo |
| `npm run dev:api` | Apenas API |
| `npm run dev:mobile` | Apenas mobile |
| `npm run build` | Build de todos os workspaces |
| `npm run lint` | ESLint (raiz + workspaces) |
| `npm run format` | Prettier (`npm run format -- .` para formatar tudo) |

### API (`apps/api`)

| Script | Descrição |
| ------ | --------- |
| `npm run dev -w api` | NestJS em watch mode |
| `npm run build -w api` | Compila para `dist/` |
| `npm run test -w api` | Testes unitários (Jest) |
| `npm run db:migrate -w api` | `prisma migrate dev` |
| `npm run db:generate -w api` | `prisma generate` |
| `npm run db:studio -w api` | Prisma Studio (UI do banco) |

### Mobile (`apps/mobile`)

| Script | Descrição |
| ------ | --------- |
| `npm run dev -w mobile` | `expo start` |
| `npm run build -w mobile` | Export web (`expo export --platform web`) |

---

## CI

Push e pull requests disparam o workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

- Job **api** — lint + build (com URLs de banco stub, sem secrets reais)
- Job **mobile** — lint + build

Verifique em **GitHub → Actions** após o push.

---

## Troubleshooting

### Estilos NativeWind não aparecem / tema errado

Limpe o cache do Metro e reinicie:

```bash
npx expo start -c -w mobile
```

### Supabase pausado ou banco inacessível

- Projetos gratuitos pausam após inatividade. No [dashboard](https://supabase.com/dashboard), clique em **Restore project**.
- Se a API não conectar, confira `DATABASE_URL` e `DIRECT_URL` em `apps/api/.env`.
- Teste a conexão com `npm run db:studio -w api`.

### Porta 3000 em uso (`EADDRINUSE`)

Altere a porta na API:

```env
# apps/api/.env
PORT=3001
```

Atualize também `EXPO_PUBLIC_API_URL` no mobile para a nova porta.

### API offline no Dashboard do mobile

| Sintoma | Causa provável | Solução |
| ------- | -------------- | ------- |
| "API offline" no emulador Android | `localhost` não resolve para o host | Use `http://10.0.2.2:3000` |
| Offline no celular físico | IP ou rede errados | Mesma Wi‑Fi; use IP LAN (`http://192.168.x.x:3000`) |
| Offline em todos os ambientes | API parada ou porta errada | `npm run dev:api` e confira `curl /health` |

### Variável de ambiente ausente na API

A API valida env vars no boot (Zod). Se faltar `DATABASE_URL`, por exemplo, o terminal mostra o nome da variável — preencha `apps/api/.env` conforme `.env.example`.

### Reset do banco local (dev)

Para recriar o schema do zero no Supabase de dev:

```bash
npm run db:migrate -w api
# Se necessário, use prisma migrate reset (apaga dados):
npx prisma migrate reset -w api
```

---

## Especificações

| Documento | Conteúdo |
| --------- | -------- |
| [`.specs/project/PROJECT.md`](.specs/project/PROJECT.md) | Visão, goals, escopo MVP |
| [`.specs/features/scaffolding/spec.md`](.specs/features/scaffolding/spec.md) | Requisitos do scaffolding |
| [`.specs/features/scaffolding/design.md`](.specs/features/scaffolding/design.md) | Arquitetura e decisões técnicas |

---

## Licença

Projeto privado — uso interno.
