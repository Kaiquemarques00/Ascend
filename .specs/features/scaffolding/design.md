# Project Scaffolding Design

**Spec:** `.specs/features/scaffolding/spec.md`  
**Status:** Approved  
**Milestone:** M1 — Fundação

---

## Architecture Overview

Monorepo **npm workspaces** com dois apps independentes: `apps/mobile` (Expo) e `apps/api` (NestJS). O mobile comunica **exclusivamente com a API REST** — sem acesso direto ao Supabase. A API usa **Prisma ORM** para persistência no PostgreSQL do Supabase, com **duas connection strings** (pooler para runtime, direct para migrations).

```mermaid
graph TB
    subgraph Mobile["apps/mobile"]
        ER[Expo Router]
        RQ[React Query]
        NW[NativeWind]
        API_CLIENT[lib/api.ts]
        ER --> RQ
        RQ --> API_CLIENT
    end

    subgraph API["apps/api"]
        HC[HealthController]
        PS[PrismaService]
        CF[ConfigModule]
        HC --> PS
        PS --> CF
    end

    subgraph Supabase
        PG[(PostgreSQL)]
        POOL[Supavisor :6543]
        DIRECT[Direct :5432]
    end

    API_CLIENT -->|HTTP GET /health| HC
    PS -->|runtime| POOL
    POOL --> PG
    PS -->|migrations CLI| DIRECT
    DIRECT --> PG
```

### Repository Layout

```
ASCEND/
├── .github/
│   └── workflows/
│       └── ci.yml
├── .specs/                          # TLC docs (existente)
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── config/
│   │   │   │   ├── config.module.ts
│   │   │   │   └── env.validation.ts
│   │   │   ├── prisma/
│   │   │   │   ├── prisma.module.ts
│   │   │   │   └── prisma.service.ts
│   │   │   ├── health/
│   │   │   │   ├── health.module.ts
│   │   │   │   ├── health.controller.ts
│   │   │   │   └── health.service.ts
│   │   │   └── common/
│   │   │       └── filters/
│   │   │           └── http-exception.filter.ts
│   │   ├── .env.example
│   │   ├── nest-cli.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── mobile/
│       ├── app/
│       │   ├── _layout.tsx
│       │   └── (tabs)/
│       │       ├── _layout.tsx
│       │       ├── index.tsx          # Dashboard
│       │       ├── areas.tsx
│       │       ├── goals.tsx
│       │       └── profile.tsx
│       ├── components/
│       │   ├── Screen.tsx
│       │   └── ApiStatus.tsx          # P2
│       ├── constants/
│       │   └── theme.ts
│       ├── lib/
│       │   ├── api.ts
│       │   └── query-client.ts
│       ├── global.css
│       ├── tailwind.config.js
│       ├── metro.config.js
│       ├── babel.config.js
│       ├── nativewind-env.d.ts
│       ├── .env.example
│       ├── app.json
│       ├── package.json
│       └── tsconfig.json
├── .gitignore
├── .prettierrc
├── .nvmrc                           # 20
├── eslint.config.mjs                # flat config compartilhado
├── package.json                     # workspaces root
├── tsconfig.base.json
└── README.md
```

**Sem `packages/shared` no scaffolding** — tipos compartilhados serão adicionados quando auth ou DTOs justificarem (evita over-engineering inicial).

---

## Code Reuse Analysis

### Existing Components to Leverage

| Component | Location | How to Use |
| --------- | -------- | ---------- |
| _Nenhum_ | — | Greenfield — sem código existente |

### Integration Points

| System | Integration Method |
| ------ | ------------------ |
| Supabase PostgreSQL | Prisma `DATABASE_URL` (pooler :6543) + `DIRECT_URL` (:5432) |
| Expo dev server | `EXPO_PUBLIC_API_URL` apontando para host da API |
| GitHub Actions | Root `npm ci` + workspace scripts |

---

## Tech Decisions

| Decision | Choice | Rationale | SCAF |
| -------- | ------ | --------- | ---- |
| Package manager | npm workspaces | Zero config extra, nativo Node 20+, spec default | 01–05 |
| ORM | Prisma 6.x | DX excelente com NestJS; `directUrl` nativo para Supabase; Prisma 7 tem setup mais complexo | 18–27 |
| Migrations | Prisma Migrate | Versionadas, idempotentes, integradas ao schema | 18–27 |
| Mobile → Backend | API only | Segurança, lógica centralizada; auth JWT virá na API | 41–44 |
| Expo SDK | SDK 52 (pinned) | Estável com NativeWind 4.2.x; evita incompatibilidades Reanimated v4 | 06–11 |
| NativeWind | 4.2.1 + Tailwind 3.4.17 | Versões pinadas — NativeWind tem histórico de breakage entre SDKs | 06–11 |
| Navigation | Expo Router (tabs) | Spec requirement; file-based routing | 09 |
| API port | 3000 default | Convenção NestJS; override via `PORT` | 12–17 |
| Config validation | `@nestjs/config` + Zod | Fail-fast com mensagem clara de env faltando | 28–32 |
| CI | GitHub Actions | Lint + build sem secrets de DB | 37–40 |
| Lint/format | ESLint 9 flat + Prettier | Padrão moderno; root config estendido por apps | 33–36 |

---

## Components

### Root Workspace (`package.json`)

- **Purpose:** Orquestrar install, dev, build e lint dos dois apps
- **Location:** `/package.json`
- **Interfaces:**
  - `npm install` — instala todas as workspaces
  - `npm run dev` — `concurrently` api + mobile
  - `npm run dev:api` / `npm run dev:mobile` — apps isolados
  - `npm run build` / `npm run lint` / `npm run format`
- **Dependencies:** `concurrently` (dev)
- **Reuses:** —

### NestJS Config Module

- **Purpose:** Carregar e validar variáveis de ambiente na inicialização
- **Location:** `apps/api/src/config/`
- **Interfaces:**
  - `ConfigModule.forRoot({ isGlobal: true, validate })` — bootstrap
  - `env.validation.ts` — schema Zod: `DATABASE_URL`, `DIRECT_URL`, `PORT`, `NODE_ENV`
- **Dependencies:** `@nestjs/config`, `zod`
- **Reuses:** —

**Validated env schema:**

```typescript
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
});
```

### Prisma Module

- **Purpose:** Singleton PrismaClient com lifecycle NestJS e verificação de conexão
- **Location:** `apps/api/src/prisma/`
- **Interfaces:**
  - `PrismaService extends PrismaClient` — `onModuleInit()` → `$connect()`, `onModuleDestroy()` → `$disconnect()`
  - `isHealthy(): Promise<boolean>` — `SELECT 1` via `$queryRaw`
- **Dependencies:** `@prisma/client`, `prisma` (dev)
- **Reuses:** —

**Prisma datasource config:**

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

> `DATABASE_URL` = Supavisor transaction mode (`:6543?pgbouncer=true`)  
> `DIRECT_URL` = session/direct (`:5432`) — usado pelo Prisma Migrate

### Health Module

- **Purpose:** Endpoint de verificação de API e banco
- **Location:** `apps/api/src/health/`
- **Interfaces:**
  - `GET /health` → `HealthResponse`
  - `HealthService.check()` — agrega status API + DB
- **Dependencies:** PrismaService
- **Reuses:** —

```typescript
interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;       // ISO8601
  database: 'connected' | 'disconnected';
}
```

- `status: 'ok'` quando DB conectado (SCAF-12)
- `status: 'degraded'` quando API sobe mas DB falha — útil para debug local

### HTTP Exception Filter

- **Purpose:** Respostas de erro consistentes; sem stack trace em produção
- **Location:** `apps/api/src/common/filters/http-exception.filter.ts`
- **Interfaces:**
  - Catch all → `{ statusCode, message, timestamp }`
- **Dependencies:** `ConfigService` (NODE_ENV)
- **Reuses:** NestJS `ExceptionFilter`

### Expo Root Layout

- **Purpose:** Providers globais (React Query, SafeArea, tema dark)
- **Location:** `apps/mobile/app/_layout.tsx`
- **Interfaces:**
  - `QueryClientProvider` com `lib/query-client.ts`
  - Import `../global.css`
  - `StatusBar style="light"`
- **Dependencies:** `@tanstack/react-query`, `react-native-safe-area-context`
- **Reuses:** —

### Tab Navigator

- **Purpose:** 4 tabs do MVP shell conforme protótipo
- **Location:** `apps/mobile/app/(tabs)/_layout.tsx`
- **Interfaces:**
  - Tabs: Dashboard (`index`), Áreas, Objetivos, Perfil
  - `tabBarActiveTintColor` → `theme.colors.primary`
  - `tabBarStyle` → `backgroundColor: theme.colors.surface`
- **Dependencies:** `expo-router`, `@expo/vector-icons`
- **Reuses:** `constants/theme.ts`

### Theme Constants

- **Purpose:** Design tokens alinhados ao protótipo dark
- **Location:** `apps/mobile/constants/theme.ts`
- **Interfaces:**

```typescript
export const colors = {
  background: '#0F172A',   // slate-900 — fundo principal
  surface: '#1E293B',      // slate-800 — cards
  primary: '#8B5CF6',      // violet-500 — acento
  success: '#22C55E',      // green-500 — progresso/momentum
  warning: '#F59E0B',      // amber-500 — energia
  insight: '#EAB308',      // yellow-500 — insights
  text: '#F8FAFC',         // slate-50
  textMuted: '#94A3B8',    // slate-400
} as const;
```

- **Reuses:** NativeWind classes mapeiam para estes valores no `tailwind.config.js`

### API Client (Mobile)

- **Purpose:** Fetch wrapper tipado para chamadas à API
- **Location:** `apps/mobile/lib/api.ts`
- **Interfaces:**
  - `getHealth(): Promise<HealthResponse>` — `GET /health`
  - `apiFetch<T>(path, options?)` — base para features futuras
- **Dependencies:** `EXPO_PUBLIC_API_URL`
- **Reuses:** —

### ApiStatus Component (P2)

- **Purpose:** Exibir status de conexão no Dashboard via React Query
- **Location:** `apps/mobile/components/ApiStatus.tsx`
- **Interfaces:**
  - `useQuery({ queryKey: ['health'], queryFn: getHealth, retry: 1 })`
  - Render: "API conectada" (verde) / "API offline" (muted)
- **Dependencies:** API client, React Query
- **Reuses:** `Screen.tsx` wrapper

### Screen Wrapper

- **Purpose:** Layout consistente para placeholder screens
- **Location:** `apps/mobile/components/Screen.tsx`
- **Interfaces:**
  - Props: `title`, `children`
  - `SafeAreaView` + `className="flex-1 bg-background px-4"`
- **Reuses:** theme tokens

### CI Workflow

- **Purpose:** Lint + build em PR/push sem secrets
- **Location:** `.github/workflows/ci.yml`
- **Interfaces:**
  - Matrix ou sequential: lint api, lint mobile, build api, build mobile
  - Stub `DATABASE_URL` e `DIRECT_URL` para build (Prisma generate only)
- **Reuses:** Root npm scripts

---

## Data Models

Prisma schema completo em `apps/api/prisma/schema.prisma`. Tabelas em `snake_case` via `@@map`; colunas via `@map`.

### Enums

```prisma
enum GoalStatus {
  ACTIVE
  COMPLETED
  ARCHIVED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum ProgressScore {
  MUCH
  MEDIUM
  LITTLE
  NONE
}

enum SatisfactionScore {
  EXCELLENT
  GOOD
  NEUTRAL
  BAD
}
```

### User

```prisma
model User {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  email     String   @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  areas          Area[]
  goals          Goal[]
  energyLogs     EnergyLog[]
  streaks        Streak[]
  achievements   Achievement[]
  weeklyReviews  WeeklyReview[]
  notifications  Notification[]

  @@map("users")
}
```

> `password_hash` e campos OAuth serão adicionados na feature Authentication.

### Area

```prisma
model Area {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  name      String
  icon      String
  color     String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user     User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  goals    Goal[]
  streaks  Streak[]
  progress AreaProgress?

  @@map("areas")
}
```

### Goal

```prisma
model Goal {
  id          String     @id @default(uuid()) @db.Uuid
  userId      String     @map("user_id") @db.Uuid
  areaId      String     @map("area_id") @db.Uuid
  title       String
  description String?
  targetDate  DateTime?  @map("target_date") @db.Date
  status      GoalStatus @default(ACTIVE)
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  area  Area   @relation(fields: [areaId], references: [id], onDelete: Cascade)
  tasks Task[]

  @@map("goals")
}
```

### Task

```prisma
model Task {
  id        String       @id @default(uuid()) @db.Uuid
  goalId    String       @map("goal_id") @db.Uuid
  title     String
  dueDate   DateTime?    @map("due_date")
  priority  TaskPriority @default(MEDIUM)
  status    TaskStatus   @default(PENDING)
  createdAt DateTime     @default(now()) @map("created_at")
  updatedAt DateTime     @updatedAt @map("updated_at")

  goal     Goal          @relation(fields: [goalId], references: [id], onDelete: Cascade)
  feedback TaskFeedback?

  @@map("tasks")
}
```

### EnergyLog

```prisma
model EnergyLog {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  value     Int      // 1-5, validated at app layer
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("energy_logs")
}
```

### TaskFeedback

```prisma
model TaskFeedback {
  id                String            @id @default(uuid()) @db.Uuid
  taskId            String            @unique @map("task_id") @db.Uuid
  progressScore     ProgressScore     @map("progress_score")
  satisfactionScore SatisfactionScore @map("satisfaction_score")
  note              String?
  createdAt         DateTime          @default(now()) @map("created_at")

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@map("task_feedback")
}
```

### Streak

```prisma
model Streak {
  id           String @id @default(uuid()) @db.Uuid
  userId       String @map("user_id") @db.Uuid
  areaId       String @map("area_id") @db.Uuid
  currentValue Int    @default(0) @map("current_value")
  bestValue    Int    @default(0) @map("best_value")
  updatedAt    DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  area Area @relation(fields: [areaId], references: [id], onDelete: Cascade)

  @@unique([userId, areaId])
  @@map("streaks")
}
```

### AreaProgress

```prisma
model AreaProgress {
  id     String @id @default(uuid()) @db.Uuid
  areaId String @unique @map("area_id") @db.Uuid
  xp     Int    @default(0)
  level  Int    @default(1)
  updatedAt DateTime @updatedAt @map("updated_at")

  area Area @relation(fields: [areaId], references: [id], onDelete: Cascade)

  @@map("area_progress")
}
```

### Achievement

```prisma
model Achievement {
  id              String   @id @default(uuid()) @db.Uuid
  userId          String   @map("user_id") @db.Uuid
  achievementName String   @map("achievement_name")
  unlockedAt      DateTime @default(now()) @map("unlocked_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, achievementName])
  @@map("achievements")
}
```

### WeeklyReview

```prisma
model WeeklyReview {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  content   String
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("weekly_reviews")
}
```

### Notification

```prisma
model Notification {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  title     String
  body      String
  read      Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notifications")
}
```

### Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ areas : has
    users ||--o{ goals : has
    users ||--o{ energy_logs : has
    users ||--o{ streaks : has
    users ||--o{ achievements : has
    users ||--o{ weekly_reviews : has
    users ||--o{ notifications : has
    areas ||--o{ goals : contains
    areas ||--o| area_progress : tracks
    areas ||--o{ streaks : tracks
    goals ||--o{ tasks : contains
    tasks ||--o| task_feedback : has
```

---

## NativeWind Configuration

### tailwind.config.js (mobile)

```javascript
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#0F172A',
        surface: '#1E293B',
        primary: '#8B5CF6',
        success: '#22C55E',
        warning: '#F59E0B',
        insight: '#EAB308',
      },
    },
  },
};
```

### Pinned mobile dependencies

```json
{
  "expo": "~52.0.0",
  "nativewind": "4.2.1",
  "tailwindcss": "3.4.17",
  "react-native-reanimated": "~3.16.1",
  "react-native-safe-area-context": "~4.12.0",
  "@tanstack/react-query": "^5.0.0",
  "expo-router": "~4.0.0"
}
```

> **Nota de implementação:** Após setup NativeWind, rodar `npx expo start -c` para limpar cache. Garantir que `content` paths incluem `app/` e `components/`.

---

## Environment Variables

### `apps/api/.env.example`

```bash
NODE_ENV=development
PORT=3000

# Supavisor transaction pooler (runtime)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct / session connection (migrations)
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

### `apps/mobile/.env.example`

```bash
# iOS simulator / web
EXPO_PUBLIC_API_URL=http://localhost:3000

# Android emulator: use http://10.0.2.2:3000
# Physical device: use http://<LAN-IP>:3000
```

---

## Error Handling Strategy

| Error Scenario | Handling | User Impact |
| -------------- | -------- | ----------- |
| Missing env var on API startup | Zod validation throws; NestJS fails to boot with variable name | Dev sees clear error in terminal |
| Supabase paused / DB unreachable | `PrismaService.$connect()` fails; log actionable message | API won't start; log mentions Supabase dashboard |
| Port 3000 in use | NestJS EADDRINUSE | Terminal error; set `PORT=3001` |
| API unreachable from mobile | React Query error state in `ApiStatus` | Dashboard shows "API offline" — no crash |
| Unhandled API exception | `HttpExceptionFilter` | JSON `{ statusCode, message, timestamp }` |
| Production 500 error | Filter hides stack trace | Generic message to client |

---

## Dev Workflow

```bash
# 1. Clone & install
npm install

# 2. Configure env
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
# Fill Supabase URLs

# 3. Run migrations
npm run db:migrate -w api

# 4. Start dev
npm run dev          # both
npm run dev:api      # API only
npm run dev:mobile   # mobile only

# 5. Verify
curl http://localhost:3000/health
# Open Expo → Dashboard shows API status
```

**Root scripts adicionais:**

| Script | Command |
| ------ | ------- |
| `db:migrate` | `prisma migrate dev` (api workspace) |
| `db:generate` | `prisma generate` (api workspace) |
| `db:studio` | `prisma studio` (api workspace) |

---

## Requirement → Design Mapping

| SCAF IDs | Design Component |
| -------- | ---------------- |
| 01–05 | Root workspace, `tsconfig.base.json`, README |
| 06–11 | Expo Router tabs, NativeWind, theme.ts, Screen |
| 12–17 | HealthModule, ConfigModule, ExceptionFilter |
| 18–27 | Prisma schema (11 models), PrismaModule, migrate |
| 28–32 | env.validation.ts, `.env.example` files |
| 33–36 | ESLint flat config, Prettier, Husky (optional) |
| 37–40 | `.github/workflows/ci.yml` |
| 41–44 | `lib/api.ts`, ApiStatus, React Query |
| 45–47 | README sections |

---

## Implementation Order (for Tasks phase)

1. **T1** — Root monorepo + shared tooling (SCAF 01–05, 33–36)
2. **T2** — NestJS API skeleton + config + health (SCAF 12–17, 28–32)
3. **T3** — Prisma schema + initial migration (SCAF 18–27)
4. **T4** — Expo app + NativeWind + tabs shell (SCAF 06–11)
5. **T5** — Mobile API client + ApiStatus (SCAF 41–44)
6. **T6** — CI workflow (SCAF 37–40)
7. **T7** — README completo (SCAF 45–47)

T2 e T3 podem ser sequenciais (T3 depende de T2 para PrismaModule). T4 pode rodar em **paralelo** com T2/T3 após T1.

---

## Open Questions / Uncertainties

| Topic | Status | Notes |
| ----- | ------ | ----- |
| Prisma 7 vs 6 | **Decided: Prisma 6** | Prisma 7 exige driver adapters e `prisma.config.ts` — mais complexo para scaffolding |
| Expo SDK 53+ | **Uncertain** | SDK 52 pinado por estabilidade NativeWind; upgrade avaliar em M5 polish |
| Husky pre-commit | **Optional P2** | Implementar se não atrasar T1; lint manual ok para solo dev |
