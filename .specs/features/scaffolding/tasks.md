# Project Scaffolding Tasks

**Design:** `.specs/features/scaffolding/design.md`  
**Spec:** `.specs/features/scaffolding/spec.md`  
**Status:** Approved

---

## Testing Strategy (Greenfield)

`TESTING.md` não existe ainda. Estratégia mínima para scaffolding:

| Code Layer | Test Type | Gate Command | Parallel-Safe |
| ---------- | --------- | ------------ | ------------- |
| Root config / tooling | none | `npm run lint` | Yes |
| NestJS modules | unit | `npm run test -w api` | Yes |
| Prisma schema | none | `npm run db:generate -w api` | No (schema lock) |
| Expo / mobile UI | none | `npx expo export --platform web -w mobile` (build check) | Yes |
| CI workflow | none | workflow file valid + local lint/build | Yes |
| Integration (health curl) | manual | `curl localhost:3000/health` | No |

**Gate levels:**
- **quick:** `npm run lint` + `npm run test -w api` (when tests exist)
- **build:** `npm run build -w api` (+ mobile export for mobile tasks)
- **full:** lint + build both apps + manual health check

---

## Execution Plan

### Phase 1: Monorepo Foundation (Sequential)

```
T1 ──→ T2
```

### Phase 2: Dual Track (Parallel after T2)

```
         ┌──→ T3 ──→ T4 ──→ T5 ──→ T6 ──→ T7 ──┐
T2 ──────┤                                        ├──→ T10 ──→ T12
         └──→ T8 ──→ T9 ─────────────────────────┤
                                                   └──→ T11 [P]
```

### Phase 3: Documentation (Sequential)

```
T10, T11 complete ──→ T12
```

---

## Task Breakdown

### T1: Root Monorepo Structure

**What:** Criar `package.json` root com npm workspaces, `.gitignore`, `.nvmrc` (Node 20)  
**Where:** `/package.json`, `/.gitignore`, `/.nvmrc`, `/apps/` (diretórios vazios)  
**Depends on:** None  
**Reuses:** —  
**Requirements:** SCAF-01, SCAF-02

**Tools:**
- MCP: `plugin-supabase-supabase` (consulta futura — não necessário nesta task)
- Skill: NONE

**Done when:**
- [x] `package.json` define `"workspaces": ["apps/*"]`
- [x] `.gitignore` inclui `node_modules`, `.env`, `dist`, `.expo`, `generated`
- [x] `.nvmrc` contém `20`
- [x] Diretórios `apps/mobile` e `apps/api` existem

**Tests:** none  
**Gate:** build (estrutura apenas — `npm install` sem erro após T2 adicionar apps)

**Verify:**
```bash
cat package.json | grep workspaces
test -d apps/mobile && test -d apps/api && echo OK
```

**Commit:** `chore(scaffolding): init monorepo workspace structure`

---

### T2: Shared Dev Tooling & Root Scripts

**What:** Configurar `tsconfig.base.json`, ESLint flat, Prettier e scripts root (`dev`, `build`, `lint`, `format`)  
**Where:** `/tsconfig.base.json`, `/eslint.config.mjs`, `/.prettierrc`, `/package.json`  
**Depends on:** T1  
**Reuses:** T1 workspace structure  
**Requirements:** SCAF-03, SCAF-04, SCAF-05, SCAF-33, SCAF-34, SCAF-36

**Tools:**
- Skill: NONE

**Done when:**
- [x] `npm run lint` definido (placeholder ok até apps existirem)
- [x] `npm run format` com Prettier configurado
- [x] `npm run dev` usa `concurrently` para api + mobile (scripts podem falhar até T3/T8)
- [x] `tsconfig.base.json` com `strict: true`, paths base
- [x] Gate check passes: `npm install` sem erro

**Tests:** none  
**Gate:** build (`npm install`)

**Verify:**
```bash
npm install
npm run format -- --check package.json 2>/dev/null || npm run format
```

**Commit:** `chore(scaffolding): add shared tsconfig, eslint, prettier and root scripts`

---

### T3: NestJS API Bootstrap

**What:** Inicializar app NestJS em `apps/api` com `main.ts`, `app.module.ts`, build script  
**Where:** `apps/api/`  
**Depends on:** T2  
**Reuses:** `tsconfig.base.json`  
**Requirements:** SCAF-12, SCAF-17

**Tools:**
- Skill: NONE

**Done when:**
- [x] `apps/api/package.json` com `@nestjs/core`, scripts `dev`, `build`, `test`
- [x] `nest-cli.json` e `tsconfig.json` extendendo base
- [x] `main.ts` bootstraps NestJS na porta `PORT` ou 3000
- [x] Gate check passes: `npm run build -w api`

**Tests:** none  
**Gate:** build

**Verify:**
```bash
npm run build -w api
```

**Commit:** `feat(api): bootstrap NestJS application`

---

### T4: Config Module & Environment Files

**What:** `ConfigModule` global, validação Zod de env vars, `.env.example`  
**Where:** `apps/api/src/config/`, `apps/api/.env.example`  
**Depends on:** T3  
**Reuses:** NestJS bootstrap from T3  
**Requirements:** SCAF-14, SCAF-28, SCAF-29, SCAF-30, SCAF-31, SCAF-32

**Tools:**
- MCP: `plugin-supabase-supabase` (documentar obtenção de DATABASE_URL no README — T12)
- Skill: `supabase` (referência para connection strings)

**Done when:**
- [x] `env.validation.ts` valida `DATABASE_URL`, `DIRECT_URL`, `PORT`, `NODE_ENV`
- [x] API falha no boot com mensagem clara se `DATABASE_URL` ausente
- [x] `.env.example` documenta pooler (:6543) e direct (:5432)
- [x] Gate check passes: `npm run build -w api`

**Tests:** none  
**Gate:** build

**Verify:**
```bash
# Sem .env — deve falhar com erro nomeando variável
cd apps/api && npm run start 2>&1 | grep -i DATABASE_URL
```

**Commit:** `feat(api): add config module with zod env validation`

---

### T5: Prisma Schema (11 Models)

**What:** Definir `schema.prisma` completo com enums, 11 models e FKs conforme design  
**Where:** `apps/api/prisma/schema.prisma`  
**Depends on:** T4  
**Reuses:** Config DATABASE_URL/DIRECT_URL  
**Requirements:** SCAF-18, SCAF-19, SCAF-20, SCAF-21, SCAF-22, SCAF-23, SCAF-24, SCAF-25

**Tools:**
- MCP: `plugin-supabase-supabase`
- Skill: `supabase`, `supabase-postgres-best-practices`

**Done when:**
- [x] 11 models: User, Area, Goal, Task, EnergyLog, TaskFeedback, Streak, AreaProgress, Achievement, WeeklyReview, Notification
- [x] Enums: GoalStatus, TaskPriority, TaskStatus, ProgressScore, SatisfactionScore
- [x] FKs com `onDelete: Cascade` conforme design
- [x] `@@map` snake_case em tabelas e colunas
- [x] Gate check passes: `npm run db:generate -w api`

**Tests:** none  
**Gate:** build (`prisma generate`)

**Verify:**
```bash
npm run db:generate -w api
grep -c "^model " apps/api/prisma/schema.prisma  # expect 11
```

**Commit:** `feat(api): add prisma schema with mvp data models`

---

### T6: Prisma Migration & PrismaModule

**What:** Migration inicial, `PrismaModule` + `PrismaService` com lifecycle e `isHealthy()`  
**Where:** `apps/api/prisma/migrations/`, `apps/api/src/prisma/`  
**Depends on:** T5  
**Reuses:** Prisma schema from T5  
**Requirements:** SCAF-26, SCAF-27

**Tools:**
- MCP: `plugin-supabase-supabase`
- Skill: `supabase`

**Done when:**
- [x] `prisma migrate dev --name init` gera migration (requer Supabase configurado)
- [x] `PrismaService` implementa `onModuleInit`/`onModuleDestroy` e `isHealthy()`
- [x] Root scripts: `db:migrate`, `db:generate`, `db:studio` no api workspace
- [x] API conecta ao DB quando `.env` válido (log de sucesso)
- [x] Gate check passes: `npm run build -w api`

**Tests:** none  
**Gate:** build (+ migrate manual se Supabase disponível)

**Verify:**
```bash
npm run db:migrate -w api   # requires valid .env
npm run build -w api
```

**Commit:** `feat(api): add prisma module and initial migration`

---

### T7: Health Endpoint & Exception Filter

**What:** `HealthModule` com `GET /health`, `HttpExceptionFilter` global  
**Where:** `apps/api/src/health/`, `apps/api/src/common/filters/`  
**Depends on:** T6  
**Reuses:** `PrismaService.isHealthy()`  
**Requirements:** SCAF-13, SCAF-15, SCAF-16

**Tools:**
- Skill: NONE

**Done when:**
- [x] `GET /health` retorna `{ status, timestamp, database }` com HTTP 200 quando DB ok
- [x] `status: 'degraded'` quando DB offline mas API sobe (opcional) ou API não sobe — documentar comportamento escolhido
- [x] `HttpExceptionFilter` retorna `{ statusCode, message, timestamp }` sem stack em production
- [x] Unit test: `HealthService` retorna status correto (mock PrismaService)
- [x] Gate check passes: `npm run test -w api` + `npm run build -w api`

**Tests:** unit  
**Gate:** quick

**Verify:**
```bash
npm run test -w api
npm run dev -w api &
sleep 3 && curl -s http://localhost:3000/health | jq .
```

**Commit:** `feat(api): add health endpoint and global exception filter`

---

### T8: Expo App Bootstrap [P]

**What:** Criar app Expo SDK 52 com Expo Router em `apps/mobile`  
**Where:** `apps/mobile/`  
**Depends on:** T2  
**Reuses:** Root workspace from T1/T2  
**Requirements:** SCAF-06, SCAF-09, SCAF-11

**Tools:**
- Skill: NONE

**Done when:**
- [ ] `apps/mobile/package.json` com expo ~52, expo-router ~4, typescript
- [ ] `app/_layout.tsx` root layout com `Stack` ou slot para tabs
- [ ] `app.json` configurado (nome ASCEND, slug ascend)
- [ ] Gate check passes: `npm run build -w mobile` ou `npx expo export --platform web` sem erro

**Tests:** none  
**Gate:** build

**Verify:**
```bash
npm install
npx expo export --platform web -w mobile 2>&1 | tail -5
```

**Commit:** `feat(mobile): bootstrap expo app with expo router`

---

### T9: NativeWind, Theme & Tab Shell [P]

**What:** Configurar NativeWind 4.2.1, tema dark, 4 tabs placeholder, `Screen` component  
**Where:** `apps/mobile/app/(tabs)/`, `apps/mobile/constants/theme.ts`, `apps/mobile/components/Screen.tsx`, configs NativeWind  
**Depends on:** T8  
**Reuses:** Expo bootstrap from T8  
**Requirements:** SCAF-07, SCAF-08, SCAF-10

**Tools:**
- Skill: NONE

**Done when:**
- [ ] NativeWind configurado: `global.css`, `tailwind.config.js`, `metro.config.js`, `babel.config.js`, `nativewind-env.d.ts`
- [ ] 4 tabs: Dashboard (`index`), Áreas, Objetivos, Perfil — navegáveis
- [ ] Tema dark: background `#0F172A`, primary `#8B5CF6`
- [ ] Dashboard exibe "ASCEND" + tagline "Consistência que transforma"
- [ ] React Query `QueryClientProvider` no root layout
- [ ] Gate check passes: expo export/build sem erro

**Tests:** none  
**Gate:** build

**Verify:**
```bash
npx expo start -c  # manual: 4 tabs visíveis, tema dark
```

**Commit:** `feat(mobile): add nativewind dark theme and tab navigation shell`

---

### T10: Mobile API Client & ApiStatus

**What:** `lib/api.ts`, `lib/query-client.ts`, `ApiStatus` no Dashboard  
**Where:** `apps/mobile/lib/`, `apps/mobile/components/ApiStatus.tsx`, `apps/mobile/app/(tabs)/index.tsx`  
**Depends on:** T7, T9  
**Reuses:** Health endpoint from T7, Dashboard from T9  
**Requirements:** SCAF-41, SCAF-42, SCAF-43, SCAF-44

**Tools:**
- Skill: NONE

**Done when:**
- [ ] `EXPO_PUBLIC_API_URL` em `apps/mobile/.env.example`
- [ ] `getHealth()` chama `GET /health` via fetch
- [ ] Dashboard exibe "API conectada" (verde) quando API ok
- [ ] Dashboard exibe "API offline" quando API indisponível — sem crash
- [ ] Gate check passes: `npm run build -w mobile`

**Tests:** none  
**Gate:** build (+ manual com API rodando)

**Verify:**
```bash
# Terminal 1: npm run dev -w api
# Terminal 2: npx expo start -w mobile
# Dashboard → "API conectada"
# Stop API → reload → "API offline"
```

**Commit:** `feat(mobile): add api client and connection status on dashboard`

---

### T11: GitHub Actions CI Pipeline [P]

**What:** Workflow CI com lint + build para api e mobile  
**Where:** `.github/workflows/ci.yml`  
**Depends on:** T7, T9  
**Reuses:** Root scripts from T2  
**Requirements:** SCAF-37, SCAF-38, SCAF-39, SCAF-40

**Tools:**
- Skill: NONE

**Done when:**
- [ ] Workflow dispara em `push` e `pull_request`
- [ ] Steps: checkout, setup-node 20, `npm ci`, `npm run lint`, `npm run build`
- [ ] Stub `DATABASE_URL` e `DIRECT_URL` para build (prisma generate only)
- [ ] Jobs nomeados por app em caso de falha
- [ ] Gate check passes: `npm run lint && npm run build` localmente

**Tests:** none  
**Gate:** build

**Verify:**
```bash
npm run lint && npm run build
# Push to branch → CI green
```

**Commit:** `ci(scaffolding): add github actions lint and build workflow`

---

### T12: README & Developer Onboarding

**What:** README completo com setup, scripts, troubleshooting, links para specs  
**Where:** `/README.md`  
**Depends on:** T10, T11  
**Reuses:** Dev workflow from design.md  
**Requirements:** SCAF-05, SCAF-31, SCAF-44, SCAF-45, SCAF-46, SCAF-47

**Tools:**
- MCP: `plugin-supabase-supabase` (instruções de connection string)
- Skill: `supabase`

**Done when:**
- [ ] README: overview, stack, folder structure, prerequisites (Node 20, Expo, Supabase)
- [ ] Setup steps: install → env → migrate → dev
- [ ] Documenta `EXPO_PUBLIC_API_URL` para iOS/Android/device físico
- [ ] Troubleshooting: NativeWind cache, Supabase paused, port in use
- [ ] Link para `.specs/project/PROJECT.md`
- [ ] Gate check passes: seguir README do zero em ambiente limpo (validação manual)

**Tests:** none  
**Gate:** full (manual onboarding checklist)

**Verify:**
```bash
# Checklist manual:
# [ ] npm install
# [ ] cp .env.example files + fill Supabase
# [ ] npm run db:migrate -w api
# [ ] npm run dev
# [ ] curl /health → 200
# [ ] Expo → 4 tabs + API status
```

**Commit:** `docs(scaffolding): add developer onboarding readme`

---

## Optional: T2b Husky Pre-commit (P2)

**What:** Husky + lint-staged para lint em commits  
**Where:** `/.husky/`, `/package.json`  
**Depends on:** T2, T7, T9 (lint deve passar)  
**Requirements:** SCAF-35

**Status:** Optional — implementar se não atrasar MVP scaffolding

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 ──→ T2

Phase 2 (Parallel tracks after T2):
  Track API:    T3 ──→ T4 ──→ T5 ──→ T6 ──→ T7
  Track Mobile: T8 ──→ T9

Phase 3 (After T7 + T9):
  T10 (integration)
  T11 [P] (CI — parallel with T10)

Phase 4:
  T12 (README)
```

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Root monorepo | 3 root files + dirs | ✅ Granular |
| T2: Shared tooling | config files + scripts | ✅ Granular |
| T3: NestJS bootstrap | 1 app init | ✅ Granular |
| T4: Config module | 1 module + env example | ✅ Granular |
| T5: Prisma schema | 1 schema file | ✅ Granular |
| T6: Prisma module + migration | 1 module + migration | ✅ Granular |
| T7: Health + filter | 2 modules + 1 test | ✅ Granular |
| T8: Expo bootstrap | 1 app init | ✅ Granular |
| T9: NativeWind + tabs | mobile shell (cohesive) | ✅ Granular |
| T10: API client | 2 lib files + 1 component | ✅ Granular |
| T11: CI workflow | 1 yaml file | ✅ Granular |
| T12: README | 1 doc file | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (body) | Diagram Shows | Status |
| ---- | ------------------- | ------------- | ------ |
| T1 | None | Entry point | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 (API track) | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T2 | T2 → T8 (Mobile track) | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T7, T9 | T7,T9 → T10 | ✅ Match |
| T11 | T7, T9 | T7,T9 → T11 [P] | ✅ Match |
| T12 | T10, T11 | T10,T11 → T12 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
| ---- | ---------- | --------------- | --------- | ------ |
| T1 | Root config | none | none | ✅ OK |
| T2 | Tooling config | none | none | ✅ OK |
| T3 | NestJS bootstrap | none | none | ✅ OK |
| T4 | Config module | none | none | ✅ OK |
| T5 | Prisma schema | none | none | ✅ OK |
| T6 | Prisma module | none | none | ✅ OK |
| T7 | Health service + controller | unit | unit | ✅ OK |
| T8 | Expo bootstrap | none | none | ✅ OK |
| T9 | Mobile UI shell | none | none | ✅ OK |
| T10 | API client | none | none | ✅ OK |
| T11 | CI yaml | none | none | ✅ OK |
| T12 | README | none | none | ✅ OK |

---

## Requirement Traceability

| Requirement ID | Task(s) | Status |
| -------------- | ------- | ------ |
| SCAF-01 – SCAF-05 | T1, T2, T12 | Mapped |
| SCAF-06 – SCAF-11 | T8, T9 | Mapped |
| SCAF-12 – SCAF-17 | T3, T7 | Mapped |
| SCAF-18 – SCAF-27 | T5, T6 | Mapped |
| SCAF-28 – SCAF-32 | T4, T12 | Mapped |
| SCAF-33 – SCAF-36 | T2 (+ optional T2b) | Mapped |
| SCAF-37 – SCAF-40 | T11 | Mapped |
| SCAF-41 – SCAF-44 | T10, T12 | Mapped |
| SCAF-45 – SCAF-47 | T12 | Mapped |

**Coverage:** 47 total, 47 mapped to tasks, 0 unmapped ✅

---

## Task Status Tracker

| Task | Status | Commit | Notes |
| ---- | ------ | ------ | ----- |
| T1 | Complete | — | Monorepo root structure |
| T2 | Complete | — | Shared dev tooling |
| T3 | Complete | — | NestJS bootstrap |
| T4 | Complete | — | Config module + env validation |
| T5 | Complete | — | Prisma schema (11 models) |
| T6 | Complete | — | Prisma module + initial migration |
| T7 | Complete | — | Health endpoint + exception filter |
| T8 | Pending | — | |
| T9 | Pending | — | |
| T10 | Pending | — | |
| T11 | Pending | — | |
| T12 | Pending | — | |

---

## MCPs & Skills for Execution

Antes de implementar, confirmar ferramentas por task:

| Task | Recommended MCP/Skill |
| ---- | --------------------- |
| T4, T5, T6, T12 | `plugin-supabase-supabase` + skill `supabase` |
| T5, T6 | skill `supabase-postgres-best-practices` |
| T3–T7, T8–T10 | NONE (CLI padrão) |
| T11 | `gh` CLI para validar workflow |

**Available MCPs:** `plugin-supabase-supabase`  
**Available Skills:** `tlc-spec-driven`, `supabase`, `supabase-postgres-best-practices`
