# Project Scaffolding Specification

**Milestone:** M1 — Fundação  
**Status:** Specified (tasks approved — ready for execute)  
**Related:** Authentication (feature separada — depende desta)

## Problem Statement

O ASCEND ainda não possui código — apenas documentação de produto (`ascend.md`) e planejamento (`.specs/project/`). Sem uma fundação técnica consistente (monorepo, app mobile, API, banco e tooling de desenvolvimento), nenhuma feature do MVP pode ser implementada de forma incremental e verificável.

Esta feature resolve o problema de "cold start": transformar o repositório vazio em um ambiente de desenvolvimento funcional onde mobile e backend rodam localmente, compartilham convenções e o banco está provisionado com o schema base do MVP.

## Goals

- [ ] Desenvolvedor clona o repo, instala dependências e sobe mobile + API em **< 15 minutos** seguindo o README
- [ ] App Expo exibe shell navegável com tema dark base do protótipo
- [ ] API NestJS responde a health check e conecta ao PostgreSQL (Supabase)
- [ ] Schema MVP completo aplicado via migrations versionadas e reproduzíveis

## Out of Scope

Explicitamente excluído desta feature. Documentado para evitar scope creep.

| Feature | Reason |
| ------- | ------ |
| Autenticação (registro, login, JWT, OAuth) | Feature separada no M1 — depende do scaffolding |
| CRUD de áreas, objetivos ou tarefas | M2 — Modelo de Dados Core |
| Lógica de negócio (XP, momentum, conquistas) | M4 — Gamificação |
| Deploy em produção (EAS, Railway/Render) | M5 — MVP Validation |
| Testes E2E do fluxo de usuário | Features subsequentes |
| CI/CD completo com deploy automático | Apenas CI básico (lint + build) nesta feature |
| Pacote `packages/shared` com tipos compartilhados | P2 — pode ser adicionado se design justificar |

---

## User Stories

### P1: Monorepo Structure ⭐ MVP

**User Story**: As a developer, I want a single repository with mobile and API apps so that I can develop and version both sides of ASCEND together.

**Why P1**: Sem estrutura monorepo, não há base para nenhum outro trabalho.

**Acceptance Criteria**:

1. WHEN developer clones the repository THEN system SHALL provide `apps/mobile` (Expo) and `apps/api` (NestJS) as distinct applications
2. WHEN developer runs the root install command THEN system SHALL install dependencies for all workspace packages without manual per-app setup
3. WHEN developer runs documented dev scripts THEN system SHALL start mobile and API independently or together
4. WHEN repository is inspected THEN system SHALL include root-level config files for TypeScript, linting and formatting shared across apps
5. WHEN developer reads README THEN system SHALL document prerequisites (Node.js version, package manager, Expo CLI, Supabase account)

**Independent Test**: Clone repo → `npm install` (or documented equivalent) → both `apps/mobile` and `apps/api` exist with valid `package.json` and start scripts.

---

### P1: Expo Mobile Shell ⭐ MVP

**User Story**: As a developer, I want a running Expo app with navigation and base styling so that I can build MVP screens on a consistent foundation.

**Why P1**: Mobile-first é o canal principal do produto; o shell valida stack e design system antes das telas reais.

**Acceptance Criteria**:

1. WHEN developer runs the mobile dev command THEN system SHALL launch Expo app on simulator/device without errors
2. WHEN app loads THEN system SHALL display a placeholder home screen with ASCEND branding (nome + tagline)
3. WHEN app loads THEN system SHALL apply dark theme base matching prototype palette (navy background `#0F172A` or equivalent, purple accent `#8B5CF6` or equivalent)
4. WHEN app loads THEN system SHALL include bottom tab navigation with 4 tabs: Dashboard, Áreas, Objetivos, Perfil (placeholder screens)
5. WHEN app is built THEN system SHALL use TypeScript, NativeWind for styling and React Query provider configured (no API calls required yet)
6. WHEN developer inspects mobile app THEN system SHALL use Expo Router for file-based navigation

**Independent Test**: `npx expo start` in `apps/mobile` → app opens → 4 tabs navigable → dark theme visible.

---

### P1: NestJS API Foundation ⭐ MVP

**User Story**: As a developer, I want a NestJS API with modular structure and health endpoint so that I can add domain modules incrementally.

**Why P1**: Toda lógica de negócio e persistência passará pela API; fundação modular evita refatoração prematura.

**Acceptance Criteria**:

1. WHEN developer runs the API dev command THEN system SHALL start NestJS on documented port (default `3000`)
2. WHEN `GET /health` is called THEN API SHALL return `200` with JSON `{ "status": "ok", "timestamp": "<ISO8601>" }`
3. WHEN API starts THEN system SHALL load configuration from environment variables via `@nestjs/config`
4. WHEN API code is inspected THEN system SHALL follow modular structure: `app`, `config`, `database` (or `prisma`) modules at minimum
5. WHEN unhandled error occurs THEN API SHALL return consistent error response format (status code + message, no stack trace in production mode)
6. WHEN API is built THEN system SHALL compile TypeScript without errors via `npm run build`

**Independent Test**: `npm run start:dev` in `apps/api` → `curl localhost:3000/health` returns 200 with expected JSON.

---

### P1: Database Schema & Migrations ⭐ MVP

**User Story**: As a developer, I want the full MVP database schema applied via versioned migrations so that feature teams can implement CRUD without schema work.

**Why P1**: Schema é contrato entre backend e features; adiar cria retrabalho em cada milestone.

**Acceptance Criteria**:

1. WHEN migrations are run against empty Supabase PostgreSQL THEN system SHALL create all MVP tables: `users`, `areas`, `goals`, `tasks`, `energy_logs`, `task_feedback`, `streaks`, `area_progress`, `achievements`, `weekly_reviews`, `notifications`
2. WHEN `users` table is created THEN it SHALL have columns: `id` (UUID PK), `name`, `email` (unique), `created_at`
3. WHEN `areas` table is created THEN it SHALL have FK `user_id` → `users.id` with `ON DELETE CASCADE`
4. WHEN `goals` table is created THEN it SHALL have FKs `user_id` → `users`, `area_id` → `areas` with appropriate cascade rules
5. WHEN `tasks` table is created THEN it SHALL have FK `goal_id` → `goals.id`
6. WHEN `task_feedback` table is created THEN it SHALL have FK `task_id` → `tasks.id` with `ON DELETE CASCADE`
7. WHEN `streaks` and `area_progress` tables are created THEN they SHALL have FK `area_id` → `areas.id`
8. WHEN all tables are created THEN system SHALL include `created_at` / `updated_at` timestamps where applicable
9. WHEN migration command is run twice THEN system SHALL be idempotent (no duplicate tables or errors)
10. WHEN API starts THEN system SHALL verify database connectivity and log success or fail clearly

**Independent Test**: Run migrations on fresh Supabase project → all 11 tables exist with correct FKs → API connects successfully.

---

### P1: Environment Configuration ⭐ MVP

**User Story**: As a developer, I want documented environment variables with safe defaults and examples so that I can configure local development without guessing.

**Why P1**: Supabase credentials e ports são bloqueadores comuns no cold start.

**Acceptance Criteria**:

1. WHEN developer opens repo THEN system SHALL provide `.env.example` files for `apps/api` (and mobile if needed) listing all required variables
2. WHEN `.env.example` is read THEN it SHALL document: `DATABASE_URL`, `PORT`, `NODE_ENV` at minimum for API
3. WHEN developer copies `.env.example` to `.env` THEN system SHALL NOT commit `.env` (listed in `.gitignore`)
4. WHEN README environment section is read THEN it SHALL explain how to obtain Supabase `DATABASE_URL` from project dashboard
5. WHEN required env var is missing THEN API SHALL fail at startup with clear error message naming the missing variable

**Independent Test**: Fresh clone → copy `.env.example` → fill Supabase URL → API starts; remove `DATABASE_URL` → API fails with explicit error.

---

### P2: Shared Tooling & Code Quality

**User Story**: As a developer, I want consistent linting, formatting and git hooks so that code quality is enforced automatically.

**Why P2**: Importante para manutenção, mas não bloqueia primeiro desenvolvimento de features.

**Acceptance Criteria**:

1. WHEN developer runs root lint command THEN system SHALL lint both `apps/mobile` and `apps/api` without errors on initial scaffold
2. WHEN developer runs format command THEN system SHALL apply Prettier (or equivalent) consistently
3. WHEN developer commits code THEN pre-commit hook (optional Husky) SHALL run lint on staged files
4. WHEN TypeScript is used THEN root `tsconfig` base SHALL be extended by each app

**Independent Test**: `npm run lint` passes on scaffold → intentional lint error is caught.

---

### P2: Basic CI Pipeline

**User Story**: As a developer, I want GitHub Actions to verify builds on push so that broken code is caught early.

**Why P2**: Protege o monorepo conforme o time cresce; não bloqueia desenvolvimento local inicial.

**Acceptance Criteria**:

1. WHEN pull request is opened THEN CI SHALL run lint for mobile and API
2. WHEN pull request is opened THEN CI SHALL run build for mobile and API
3. WHEN CI fails THEN developer SHALL see which app failed in workflow logs
4. WHEN CI runs THEN it SHALL NOT require production secrets (uses stub env or skips DB integration tests)

**Independent Test**: Push to branch → GitHub Actions workflow runs → lint + build pass on clean scaffold.

---

### P2: Mobile ↔ API Connectivity Stub

**User Story**: As a developer, I want the mobile app configured to call the API base URL so that feature work can add endpoints without infra changes.

**Why P2**: Valida integração cross-app antes de auth; prova que React Query + API client funcionam.

**Acceptance Criteria**:

1. WHEN mobile app loads THEN system SHALL have API client configured with base URL from env (`EXPO_PUBLIC_API_URL`)
2. WHEN Dashboard tab is opened THEN app SHALL call `GET /health` via React Query and display connection status ("API conectada" / "API offline")
3. WHEN API is unreachable THEN mobile SHALL display graceful offline state without crash
4. WHEN running on Android emulator THEN README SHALL document using `10.0.2.2` instead of `localhost` for API URL

**Independent Test**: Start API → open mobile Dashboard → sees "API conectada"; stop API → sees offline message.

---

### P3: Root README & Developer Experience

**User Story**: As a developer, I want a comprehensive README so that onboarding is self-service.

**Why P3**: Nice-to-have polish; partial README is acceptable in P1.

**Acceptance Criteria**:

1. WHEN README is read THEN it SHALL include: project overview, tech stack, folder structure, setup steps, available scripts
2. WHEN README is read THEN it SHALL link to `.specs/project/PROJECT.md` for product context
3. WHEN README is read THEN it SHALL include troubleshooting section (common Expo/Supabase issues)

**Independent Test**: New developer follows README only → successful local setup.

---

## Edge Cases

- WHEN Node.js version is below minimum THEN install script SHALL warn or fail with required version
- WHEN Supabase project is paused (free tier) THEN API startup SHALL log connection error with actionable message
- WHEN port 3000 is already in use THEN API SHALL fail with clear "port in use" message or support `PORT` override
- WHEN Expo runs on physical device THEN README SHALL document LAN IP configuration for `EXPO_PUBLIC_API_URL`
- WHEN migration is rolled back THEN system SHALL support down migration or documented reset procedure
- WHEN Windows developer clones repo THEN all scripts SHALL work in Git Bash / PowerShell (no bash-only assumptions without note)

---

## Assumptions (for Design phase)

Decisões técnicas a resolver em `design.md` — não bloqueiam aprovação desta spec:

| Topic | Default assumption | Alternative |
| ----- | ------------------ | ----------- |
| Package manager | npm workspaces | pnpm / yarn |
| ORM / DB client | Prisma | Drizzle, TypeORM, raw `pg` |
| Migrations | Prisma Migrate or Supabase CLI | — |
| Mobile → Backend | API only (no direct Supabase from mobile) | Supabase client on mobile for realtime |
| Monorepo layout | `apps/mobile` + `apps/api` | + `packages/shared` |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| SCAF-01 | P1: Monorepo Structure | Design | ✅ Designed |
| SCAF-02 | P1: Monorepo Structure | Design | ✅ Designed |
| SCAF-03 | P1: Monorepo Structure | Design | ✅ Designed |
| SCAF-04 | P1: Monorepo Structure | Design | ✅ Designed |
| SCAF-05 | P1: Monorepo Structure | Design | ✅ Designed |
| SCAF-06 | P1: Expo Mobile Shell | Design | ✅ Designed |
| SCAF-07 | P1: Expo Mobile Shell | Design | ✅ Designed |
| SCAF-08 | P1: Expo Mobile Shell | Design | ✅ Designed |
| SCAF-09 | P1: Expo Mobile Shell | Design | ✅ Designed |
| SCAF-10 | P1: Expo Mobile Shell | Design | ✅ Designed |
| SCAF-11 | P1: Expo Mobile Shell | Design | ✅ Designed |
| SCAF-12 | P1: NestJS API Foundation | Design | ✅ Designed |
| SCAF-13 | P1: NestJS API Foundation | Design | ✅ Designed |
| SCAF-14 | P1: NestJS API Foundation | Design | ✅ Designed |
| SCAF-15 | P1: NestJS API Foundation | Design | ✅ Designed |
| SCAF-16 | P1: NestJS API Foundation | Design | ✅ Designed |
| SCAF-17 | P1: NestJS API Foundation | Design | ✅ Designed |
| SCAF-18 | P1: Database Schema & Migrations | Design | ✅ Designed |
| SCAF-19 | P1: Database Schema & Migrations | Design | ✅ Designed |
| SCAF-20 | P1: Database Schema & Migrations | Design | ✅ Designed |
| SCAF-21 | P1: Database Schema & Migrations | Design | ✅ Designed |
| SCAF-22 | P1: Database Schema & Migrations | Design | ✅ Designed |
| SCAF-23 | P1: Database Schema & Migrations | Design | ✅ Designed |
| SCAF-24 | P1: Database Schema & Migrations | Design | ✅ Designed |
| SCAF-25 | P1: Database Schema & Migrations | Design | ✅ Designed |
| SCAF-26 | P1: Database Schema & Migrations | Design | ✅ Designed |
| SCAF-27 | P1: Database Schema & Migrations | Design | ✅ Designed |
| SCAF-28 | P1: Environment Configuration | Design | ✅ Designed |
| SCAF-29 | P1: Environment Configuration | Design | ✅ Designed |
| SCAF-30 | P1: Environment Configuration | Design | ✅ Designed |
| SCAF-31 | P1: Environment Configuration | Design | ✅ Designed |
| SCAF-32 | P1: Environment Configuration | Design | ✅ Designed |
| SCAF-33 | P2: Shared Tooling | Tasks | ✅ Mapped → T2 |
| SCAF-34 | P2: Shared Tooling | Tasks | ✅ Mapped → T2 |
| SCAF-35 | P2: Shared Tooling | Tasks | ✅ Mapped → T2b (optional) |
| SCAF-36 | P2: Shared Tooling | Tasks | ✅ Mapped → T2 |
| SCAF-37 | P2: Basic CI Pipeline | Tasks | ✅ Mapped → T11 |
| SCAF-38 | P2: Basic CI Pipeline | Tasks | ✅ Mapped → T11 |
| SCAF-39 | P2: Basic CI Pipeline | Tasks | ✅ Mapped → T11 |
| SCAF-40 | P2: Basic CI Pipeline | Tasks | ✅ Mapped → T11 |
| SCAF-41 | P2: Mobile ↔ API Connectivity | Tasks | ✅ Mapped → T10 |
| SCAF-42 | P2: Mobile ↔ API Connectivity | Tasks | ✅ Mapped → T10 |
| SCAF-43 | P2: Mobile ↔ API Connectivity | Tasks | ✅ Mapped → T10 |
| SCAF-44 | P2: Mobile ↔ API Connectivity | Tasks | ✅ Mapped → T10, T12 |
| SCAF-45 | P3: README & DX | Tasks | ✅ Mapped → T12 |
| SCAF-46 | P3: README & DX | Tasks | ✅ Mapped → T12 |
| SCAF-47 | P3: README & DX | Tasks | ✅ Mapped → T12 |

**Coverage:** 47 total, 47 mapped to tasks, 0 unmapped ✅

---

## Success Criteria

How we know the feature is successful:

- [ ] Novo desenvolvedor sobe mobile + API + banco em < 15 minutos via README
- [ ] `GET /health` retorna 200; mobile exibe status de conexão (P2)
- [ ] 11 tabelas MVP existem no Supabase com FKs corretas
- [ ] 4 tabs navegáveis no app com tema dark base
- [ ] CI passa lint + build em PR (P2)
- [ ] Zero secrets commitados no repositório
