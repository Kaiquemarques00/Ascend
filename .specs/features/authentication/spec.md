# Authentication Specification

**Milestone:** M1 — Fundação  
**Status:** Specified (tasks approved — ready for execute)  
**Depends on:** [Project Scaffolding](../scaffolding/spec.md) (Complete)  
**Blocks:** M2 — Life Areas, Goals, Daily Tasks (todos os CRUDs exigem `userId` autenticado)

## Problem Statement

O ASCEND já possui monorepo funcional, schema de banco com tabela `users` e shell mobile com aba Perfil — mas **nenhum usuário pode se identificar**. Sem autenticação, endpoints de domínio não podem ser protegidos por `userId`, o mobile não persiste sessão e dados de um usuário ficariam acessíveis a qualquer requisição.

Esta feature introduz identidade e sessão: registro/login, tokens JWT emitidos pela API NestJS (não Supabase Auth no client), e estado autenticado no mobile — desbloqueando M2 e o restante do MVP.

## Goals

- [ ] Usuário registra conta com email/senha e acessa o app em **< 2 minutos**
- [ ] API protege rotas de domínio com JWT; requisições sem token válido retornam `401`
- [ ] Mobile persiste sessão entre reinícios (token seguro + estado React Query)
- [ ] Aba Perfil exibe dados do usuário autenticado; logout funcional
- [ ] (P2) Login social Google e Apple operacional no dispositivo

## Out of Scope

Explicitamente excluído desta feature.

| Feature | Reason |
| ------- | ------ |
| Supabase Auth no mobile | Arquitetura define mobile → API only; JWT custom na API |
| Onboarding guiado (áreas, objetivos) | M3 — Loop Diário |
| CRUD de áreas/objetivos/tarefas | M2 — depende de auth, mas não faz parte desta feature |
| MFA / 2FA | Complexidade desnecessária para MVP solo |
| Roles / admin panel | Single-user app; sem multi-tenant |
| Email verification obrigatória no registro | P3 — adiar para não bloquear MVP |
| Password reset por email | P3 — requer serviço de email (Resend, etc.) |
| Biometria (Face ID / fingerprint) | P3 — polish pós-MVP |
| Rate limiting avançado / captcha | P2+ — documentar como decisão de design |
| `packages/shared` com DTOs | Pode surgir no design se justificar; não é requisito da spec |

---

## User Stories

### P1: Email Registration ⭐ MVP

**User Story**: As a new user, I want to create an account with name, email and password so that I can start using ASCEND with my own data.

**Why P1**: Sem registro, não há usuários no banco; é o caminho primário de aquisição no MVP.

**Acceptance Criteria**:

1. WHEN user submits valid `name`, `email` and `password` on register screen THEN API SHALL create a `users` row with hashed password and return JWT access token + user profile (id, name, email)
2. WHEN email already exists THEN API SHALL return `409 Conflict` with clear message (no user enumeration leak in response body beyond "email already registered")
3. WHEN password fails validation THEN API SHALL return `400 Bad Request` naming rules violated (min 8 chars, at least one letter and one number)
4. WHEN registration succeeds THEN mobile SHALL store token securely and navigate to authenticated app shell (tabs)
5. WHEN registration succeeds THEN mobile Perfil tab SHALL show user name and email

**Independent Test**: `POST /auth/register` with new email → 201 + token → mobile shows Dashboard with authenticated state → Perfil displays name.

---

### P1: Email Login ⭐ MVP

**User Story**: As a returning user, I want to log in with email and password so that I can access my data.

**Why P1**: Usuários recorrentes precisam reentrar sem criar nova conta.

**Acceptance Criteria**:

1. WHEN user submits valid email and password THEN API SHALL verify `password_hash` with bcrypt (or argon2) and return JWT access token + user profile
2. WHEN credentials are invalid THEN API SHALL return `401 Unauthorized` with generic message ("Invalid email or password")
3. WHEN user has no password (OAuth-only account) THEN API SHALL return `401` directing user to social login (message distinguishable in UI)
4. WHEN login succeeds on mobile THEN app SHALL replace auth stack with main tabs and persist session
5. WHEN login screen loads THEN it SHALL offer navigation link to register screen

**Independent Test**: Register → logout → login with same credentials → Perfil shows same user id.

---

### P1: JWT Session Management (API) ⭐ MVP

**User Story**: As the system, I want to issue and validate JWT tokens so that authenticated requests are tied to a user identity.

**Why P1**: Contrato central entre mobile e API; sem isso não há proteção de rotas.

**Acceptance Criteria**:

1. WHEN user authenticates (register, login, or OAuth) THEN API SHALL issue JWT access token signed with `JWT_SECRET` containing `sub` (user id) and `email` claims
2. WHEN access token is valid and not expired THEN `GET /auth/me` SHALL return `200` with `{ id, name, email, createdAt }`
3. WHEN access token is missing, malformed or expired THEN protected endpoints SHALL return `401 Unauthorized`
4. WHEN `JWT_SECRET` is missing at API boot THEN API SHALL fail startup with clear error (via existing Zod env validation)
5. WHEN token expires THEN mobile SHALL clear session and redirect to login (no silent anonymous access)

**Independent Test**: Call `GET /auth/me` with Bearer token → 200; without token → 401; with expired token → 401.

---

### P1: Mobile Auth State & Navigation ⭐ MVP

**User Story**: As a mobile user, I want the app to remember my session and show login only when needed so that I don't re-authenticate every open.

**Why P1**: UX mínima viável; sem persistência o fluxo é inutilizável no dia a dia.

**Acceptance Criteria**:

1. WHEN app launches with valid stored token THEN app SHALL validate via `GET /auth/me` and show main tabs without login screen
2. WHEN app launches with no token or invalid token THEN app SHALL show unauthenticated auth flow (login/register)
3. WHEN token is stored THEN mobile SHALL use secure storage (`expo-secure-store`), not plain AsyncStorage
4. WHEN user is authenticated THEN React Query SHALL include `Authorization: Bearer <token>` on API requests via shared client
5. WHEN auth state changes (login/logout) THEN navigation SHALL reset appropriately (no back to login after success)

**Independent Test**: Login → force-close app → reopen → still authenticated; logout → reopen → login screen.

---

### P1: Protected API Foundation ⭐ MVP

**User Story**: As a developer, I want a reusable auth guard on the API so that future domain modules automatically require authentication.

**Why P1**: M2 adicionará CRUDs; o padrão deve existir antes do primeiro endpoint de domínio.

**Acceptance Criteria**:

1. WHEN `AuthGuard` (or equivalent) is applied to a controller THEN requests without valid JWT SHALL not reach handler
2. WHEN request has valid JWT THEN handler SHALL receive `userId` from token via decorator (e.g. `@CurrentUser()`)
3. WHEN `GET /auth/me` is implemented THEN it SHALL be the reference protected endpoint for integration tests
4. WHEN health endpoint is called THEN it SHALL remain **public** (no auth required)
5. WHEN auth module is inspected THEN it SHALL follow NestJS modular pattern: `AuthModule`, `AuthService`, `AuthController`, `JwtStrategy`

**Independent Test**: Apply guard to sample protected route → 401 without token, 200 with token.

---

### P1: Logout & Profile View ⭐ MVP

**User Story**: As a user, I want to see my profile and log out so that I control my session on the device.

**Why P1**: Perfil é tab existente ("Em breve"); logout é requisito básico de segurança.

**Acceptance Criteria**:

1. WHEN user opens Perfil tab while authenticated THEN screen SHALL display name, email and logout button
2. WHEN user taps logout THEN mobile SHALL clear secure token storage and navigate to login
3. WHEN user taps logout THEN API MAY expose `POST /auth/logout` as no-op success (stateless JWT) OR mobile-only logout — design decide; spec requires at minimum client-side session clear
4. WHEN user is not authenticated THEN Perfil SHALL not be reachable (auth gate redirects to login)

**Independent Test**: Login → Perfil shows data → Logout → Perfil inaccessible → login again works.

---

### P2: Google Sign-In

**User Story**: As a user, I want to sign in with Google so that I can access ASCEND without creating a password.

**Why P2**: Reduz fricção de registro; `ascend.md` lista Google Login; não bloqueia validação do loop core com email.

**Acceptance Criteria**:

1. WHEN user completes Google OAuth flow on mobile THEN API SHALL verify Google ID token server-side and return JWT + user profile
2. WHEN Google email matches existing user THEN API SHALL link or login to existing account (design: link by email if no `google_id` yet)
3. WHEN user is new THEN API SHALL create `users` row with `google_id`, name and email (no `password_hash`)
4. WHEN Google token is invalid THEN API SHALL return `401` with clear error
5. WHEN Google Sign-In button is shown THEN it SHALL appear on login and register screens

**Independent Test**: Google login on device/emulator → JWT issued → Perfil shows Google-derived name/email.

---

### P2: Apple Sign-In

**User Story**: As an iOS user, I want to sign in with Apple so that I can register quickly with privacy options.

**Why P2**: Requisito comum para App Store; paridade com Google no roadmap.

**Acceptance Criteria**:

1. WHEN user completes Apple authentication on iOS THEN API SHALL verify Apple identity token server-side and return JWT + user profile
2. WHEN Apple provides private relay email THEN system SHALL store and match by `apple_id` primarily, email secondarily
3. WHEN user is new THEN API SHALL create `users` row with `apple_id`, name and email (nullable email if Apple hides it)
4. WHEN platform is Android THEN Apple button SHALL be hidden (iOS only)
5. WHEN Apple token is invalid THEN API SHALL return `401`

**Independent Test**: Apple login on iOS simulator/device → authenticated session → logout → login again.

---

### P2: Token Refresh

**User Story**: As a user, I want my session to stay active without re-entering password so that daily use is frictionless.

**Why P2**: Access tokens curtos são mais seguros; refresh evita logout frequente.

**Acceptance Criteria**:

1. WHEN user authenticates THEN API SHALL issue refresh token (HTTP-only cookie or long-lived token in body — design decides) in addition to short-lived access token
2. WHEN access token expires but refresh token is valid THEN mobile SHALL obtain new access token via `POST /auth/refresh` without user interaction
3. WHEN refresh token is invalid or revoked THEN API SHALL return `401` and mobile SHALL redirect to login
4. WHEN refresh is used THEN old refresh token SHALL be rotated (one-time use) — design detail, recommended for security

**Independent Test**: Wait for access token expiry (or mock) → API call auto-refreshes → user stays in app.

---

### P2: Profile Update

**User Story**: As a user, I want to update my display name so that my profile reflects how I want to be called.

**Why P2**: `users.name` existe; edição simples melhora UX sem complexidade.

**Acceptance Criteria**:

1. WHEN user submits valid new name on Perfil THEN `PATCH /auth/me` SHALL update `users.name` and return updated profile
2. WHEN name is empty or too long (>100 chars) THEN API SHALL return `400`
3. WHEN update succeeds THEN mobile SHALL update cached user state immediately

**Independent Test**: Change name on Perfil → persists after app restart.

---

### P3: Password Reset via Email

**User Story**: As a user who forgot my password, I want to reset it via email so that I can regain access.

**Why P3**: Importante para produção; requer integração email (Resend, SendGrid) — fora do caminho crítico MVP.

**Acceptance Criteria**:

1. WHEN user requests reset with registered email THEN API SHALL send reset link/token (no reveal if email unknown — same response)
2. WHEN user submits valid reset token and new password THEN API SHALL update `password_hash`
3. WHEN reset token expires THEN API SHALL reject with `400`

**Independent Test**: Request reset → use token → login with new password.

---

## Edge Cases

- WHEN user registers with email that later links to Google (same email) THEN system SHALL merge into single account (design: unique email constraint + populate `google_id`)
- WHEN JWT is tampered THEN API SHALL return `401`
- WHEN API is unreachable during `GET /auth/me` on app launch THEN mobile SHALL show offline-friendly message and retry (not crash; may show login after max retries — design)
- WHEN password is correct but account has only OAuth THEN login form SHALL suggest social buttons
- WHEN user deletes app and reinstalls THEN session is cleared (expected); user must login again
- WHEN multiple tabs/screens race on logout THEN only one navigation to login (idempotent)

---

## Data Model Changes (Auth)

Schema atual `User` não possui campos de auth. Esta feature **SHALL** adicionar via migration:

| Column | Type | Notes |
| ------ | ---- | ----- |
| `password_hash` | `String?` | Nullable — OAuth-only users |
| `google_id` | `String?` @unique | Google `sub` |
| `apple_id` | `String?` @unique | Apple user identifier |

> `email` permanece `@unique`. `name` obrigatório no registro email; OAuth pode usar provider display name.

---

## API Surface (Minimum)

| Method | Path | Auth | P |
| ------ | ---- | ---- | - |
| POST | `/auth/register` | Public | P1 |
| POST | `/auth/login` | Public | P1 |
| GET | `/auth/me` | Bearer | P1 |
| POST | `/auth/logout` | Bearer | P1 (optional server-side) |
| POST | `/auth/google` | Public | P2 |
| POST | `/auth/apple` | Public | P2 |
| POST | `/auth/refresh` | Refresh token | P2 |
| PATCH | `/auth/me` | Bearer | P2 |
| POST | `/auth/forgot-password` | Public | P3 |
| POST | `/auth/reset-password` | Public | P3 |

---

## Environment Variables (New)

| Variable | App | Required | Notes |
| -------- | --- | -------- | ----- |
| `JWT_SECRET` | API | P1 | Min 32 chars; signing key |
| `JWT_ACCESS_EXPIRES_IN` | API | P1 | e.g. `15m` |
| `JWT_REFRESH_EXPIRES_IN` | API | P2 | e.g. `7d` |
| `GOOGLE_CLIENT_ID` | API + Mobile | P2 | OAuth client IDs (platform-specific for mobile) |
| `APPLE_CLIENT_ID` | API | P2 | Service ID / bundle |
| `APPLE_TEAM_ID` | API | P2 | Apple developer |
| `APPLE_KEY_ID` | API | P2 | Sign in with Apple key |

Documentar em `apps/api/.env.example` e README na fase de implementação.

---

## Mobile Screens (Minimum)

| Screen | Route (sugestão) | P |
| ------ | ---------------- | - |
| Login | `/login` | P1 |
| Register | `/register` | P1 |
| Perfil (autenticado) | `/(tabs)/perfil` | P1 |
| Auth layout | `app/(auth)/_layout` | P1 |

Unauthenticated users SHALL NOT access `/(tabs)/*` — Expo Router redirect guard.

---

## Requirement Traceability

| Requirement ID | Story | Priority | Status |
| -------------- | ----- | -------- | ------ |
| AUTH-01 | P1: Email Registration | P1 | Designed |
| AUTH-02 | P1: Email Registration | P1 | Designed |
| AUTH-03 | P1: Email Registration | P1 | Designed |
| AUTH-04 | P1: Email Registration | P1 | Designed |
| AUTH-05 | P1: Email Registration | P1 | Designed |
| AUTH-06 | P1: Email Login | P1 | Designed |
| AUTH-07 | P1: Email Login | P1 | Designed |
| AUTH-08 | P1: Email Login | P1 | Designed |
| AUTH-09 | P1: Email Login | P1 | Designed |
| AUTH-10 | P1: Email Login | P1 | Designed |
| AUTH-11 | P1: JWT Session (API) | P1 | Designed |
| AUTH-12 | P1: JWT Session (API) | P1 | Designed |
| AUTH-13 | P1: JWT Session (API) | P1 | Designed |
| AUTH-14 | P1: JWT Session (API) | P1 | Designed |
| AUTH-15 | P1: JWT Session (API) | P1 | Designed |
| AUTH-16 | P1: Mobile Auth State | P1 | Designed |
| AUTH-17 | P1: Mobile Auth State | P1 | Designed |
| AUTH-18 | P1: Mobile Auth State | P1 | Designed |
| AUTH-19 | P1: Mobile Auth State | P1 | Designed |
| AUTH-20 | P1: Mobile Auth State | P1 | Designed |
| AUTH-21 | P1: Protected API | P1 | Designed |
| AUTH-22 | P1: Protected API | P1 | Designed |
| AUTH-23 | P1: Protected API | P1 | Designed |
| AUTH-24 | P1: Protected API | P1 | Designed |
| AUTH-25 | P1: Protected API | P1 | Designed |
| AUTH-26 | P1: Logout & Profile | P1 | Designed |
| AUTH-27 | P1: Logout & Profile | P1 | Designed |
| AUTH-28 | P1: Logout & Profile | P1 | Designed |
| AUTH-29 | P1: Logout & Profile | P1 | Designed |
| AUTH-30 | P2: Google Sign-In | P2 | Designed |
| AUTH-31 | P2: Google Sign-In | P2 | Designed |
| AUTH-32 | P2: Google Sign-In | P2 | Designed |
| AUTH-33 | P2: Google Sign-In | P2 | Designed |
| AUTH-34 | P2: Google Sign-In | P2 | Designed |
| AUTH-35 | P2: Apple Sign-In | P2 | Designed |
| AUTH-36 | P2: Apple Sign-In | P2 | Designed |
| AUTH-37 | P2: Apple Sign-In | P2 | Designed |
| AUTH-38 | P2: Apple Sign-In | P2 | Designed |
| AUTH-39 | P2: Apple Sign-In | P2 | Designed |
| AUTH-40 | P2: Token Refresh | P2 | Designed |
| AUTH-41 | P2: Token Refresh | P2 | Designed |
| AUTH-42 | P2: Token Refresh | P2 | Designed |
| AUTH-43 | P2: Token Refresh | P2 | Designed |
| AUTH-44 | P2: Profile Update | P2 | Designed |
| AUTH-45 | P2: Profile Update | P2 | Designed |
| AUTH-46 | P2: Profile Update | P2 | Designed |
| AUTH-47 | P3: Password Reset | P3 | Designed |
| AUTH-48 | P3: Password Reset | P3 | Designed |
| AUTH-49 | P3: Password Reset | P3 | Designed |

**Coverage:** 49 total, 49 mapped to stories, 0 unmapped ✅

---

## Success Criteria

How we know the feature is successful:

- [ ] Novo usuário completa registro email e vê Perfil com nome em < 2 minutos
- [ ] Usuário existente faz login, fecha app, reabre — sessão persistida
- [ ] `GET /auth/me` retorna 401 sem token; 200 com token válido
- [ ] Health check permanece público; rota protegida de exemplo bloqueia anônimos
- [ ] (P2) Login Google e Apple funcionam em dispositivo real ou simulador documentado
- [ ] Nenhum secret (`JWT_SECRET`, OAuth keys) commitado no repositório
- [ ] Testes unitários cobrem `AuthService` (hash, validate, token issue) — gate no design/tasks

---

## Open Questions (for Design phase)

| Topic | Options | Recommendation |
| ----- | ------- | -------------- |
| Password hashing | bcrypt vs argon2 | argon2id (modern default) or bcrypt (simpler, well-supported) |
| Refresh token transport | HTTP-only cookie vs body + SecureStore | Body + SecureStore (mobile-first; cookies awkward in RN) |
| Access token TTL | 15m vs 1h | 15m with refresh (P2) |
| OAuth account linking | Merge by email auto vs prompt user | Auto-merge by verified email |
| Register validation | class-validator vs Zod DTOs | Zod (consistent with ConfigModule) |

Estas decisões serão fechadas em `design.md` — não bloqueiam aprovação desta spec.
