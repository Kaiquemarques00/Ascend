# Authentication Tasks

**Design:** `.specs/features/authentication/design.md`  
**Spec:** `.specs/features/authentication/spec.md`  
**Status:** Approved (ready for execute)

---

## Testing Strategy

Herda estratégia do scaffolding (sem `TESTING.md` dedicado):

| Code Layer | Test Type | Gate Command | Parallel-Safe |
| ---------- | --------- | ------------ | ------------- |
| Prisma schema / migration | none | `npm run db:generate -w api` | No (schema lock) |
| Env validation | none | `npm run build -w api` | Yes |
| NestJS AuthModule / AuthService | unit | `npm run test -w api` | Yes |
| Mobile auth lib / UI | none | `npm run build -w mobile` | Yes |
| Mobile auth flow | manual | register → restart → logout | No |
| OAuth (P2) | manual | device/simulator | No |
| CI workflow update | none | `npm run lint && npm run build` | Yes |

**Gate levels:**
- **quick:** `npm run lint` + `npm run test -w api`
- **build:** `npm run build -w api` (+ `npm run build -w mobile` for mobile tasks)
- **full:** quick + build both apps + manual auth UAT

---

## Execution Plan

### Phase 1: P1 Core Auth (Sequential)

```
T1 ──→ T2 ──→ T3 ──→ T4 ──→ T5 ──→ T6
 DB      env     API     mobile   mobile   mobile
 fields  JWT     auth    lib      UI       session
```

### Phase 2: P2 Enhancements

```
              ┌──→ T7 Google [P] ──┐
T6 ───────────├──→ T8 Apple [P] ───┼──→ T9 Refresh ──→ T11 Profile
              └──→ T10 CI [P] ─────┘
```

### Phase 3: P3 (Deferred)

Password reset (AUTH-47–49) — fora do escopo deste tasks.md.

---

## Task Breakdown

### T1: Prisma Migration — Auth Fields

**What:** Migration `add_auth_fields` — `password_hash`, `google_id`, `apple_id` no model `User`  
**Where:** `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/`  
**Depends on:** Scaffolding complete (T6 scaffolding)  
**Reuses:** Existing `User` model  
**Requirements:** spec Data Model Changes

**Tools:**
- MCP: `plugin-supabase-supabase` (migrate contra Supabase dev)
- Skill: `supabase`

**Done when:**
- [x] `User` tem `passwordHash`, `googleId`, `appleId` com `@map` snake_case
- [x] `google_id` e `apple_id` são `@unique` nullable
- [x] Migration aplicada localmente (`npm run db:migrate -w api`)
- [x] Gate check passes: `npm run db:generate -w api`

**Tests:** none  
**Gate:** build (`prisma generate`)

**Verify:**
```bash
npm run db:migrate -w api
grep password_hash apps/api/prisma/schema.prisma
```

**Commit:** `feat(api): add auth fields to user model`

---

### T2: JWT Environment Validation

**What:** Estender `env.validation.ts` e `apps/api/.env.example` com `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN`  
**Where:** `apps/api/src/config/env.validation.ts`, `apps/api/.env.example`  
**Depends on:** T1  
**Reuses:** Zod pattern from scaffolding ConfigModule  
**Requirements:** AUTH-14

**Tools:**
- Skill: NONE

**Done when:**
- [x] `JWT_SECRET` required, min 32 chars
- [x] `JWT_ACCESS_EXPIRES_IN` default `7d`
- [x] API falha no boot sem `JWT_SECRET` (mensagem clara)
- [x] `.env.example` documenta geração (`openssl rand -base64 32`)
- [x] Gate check passes: `npm run build -w api`

**Tests:** none  
**Gate:** build

**Verify:**
```bash
# Sem JWT_SECRET no .env → boot error naming JWT_SECRET
npm run build -w api
```

**Commit:** `feat(api): add jwt env validation`

---

### T3: AuthModule — Register, Login, JWT, Guards

**What:** `AuthModule` completo: schemas Zod, `AuthService`, `AuthController`, `JwtStrategy`, guards, `@Public()`, `@CurrentUser()` + unit tests  
**Where:** `apps/api/src/auth/`, `apps/api/src/app.module.ts`  
**Depends on:** T2  
**Reuses:** `PrismaService`, `HttpExceptionFilter`, `HealthModule` (permanece público)  
**Requirements:** AUTH-01–15, AUTH-21–25

**Tools:**
- Skill: NONE

**Done when:**
- [x] Deps: `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt`
- [x] `POST /auth/register` → 201 + `{ accessToken, user }`; duplicate email → 409; senha inválida → 400
- [x] `POST /auth/login` → 200 + token; credenciais inválidas → 401; OAuth-only → 401 com mensagem distinta
- [x] `GET /auth/me` → 200 com Bearer; sem token → 401
- [x] `JwtAuthGuard` + `@CurrentUser()` funcionam; `@Public()` em register/login
- [x] `GET /health` permanece público (sem auth)
- [x] Unit tests: register, login, hash, duplicate email, invalid credentials, OAuth-only account
- [x] Gate check passes: `npm run test -w api` + `npm run build -w api`
- [x] Test count: ≥6 auth tests pass (no silent deletions)

**Tests:** unit  
**Gate:** quick

**Verify:**
```bash
npm run test -w api
npm run dev -w api &
sleep 3
curl -s -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"test@ascend.dev","password":"Test1234"}' | jq .
curl -s http://localhost:3000/auth/me -H "Authorization: Bearer <token>" | jq .
```

**Commit:** `feat(api): add auth module with jwt register and login`

---

### T4: Mobile Auth Library Layer

**What:** `expo-secure-store`, `auth-storage.ts`, `auth-api.ts`, `auth.types.ts`; estender `apiFetch` com Bearer + error JSON  
**Where:** `apps/mobile/lib/`, `apps/mobile/package.json`  
**Depends on:** T3  
**Reuses:** `lib/api.ts`, `EXPO_PUBLIC_API_URL`  
**Requirements:** AUTH-16–18, AUTH-20 (partial)

**Tools:**
- Skill: NONE

**Done when:**
- [x] `expo-secure-store` instalado
- [x] `auth-storage`: get/set/clear access token
- [x] `auth-api`: `register()`, `login()`, `getMe()` tipados
- [x] `apiFetch` aceita `token` option e parseia `{ statusCode, message }` em erros
- [x] Gate check passes: `npm run build -w mobile`

**Tests:** none  
**Gate:** build

**Verify:**
```bash
npm run build -w mobile
```

**Commit:** `feat(mobile): add auth storage and api client`

---

### T5: Mobile Auth UI Components

**What:** `AuthScreen`, `AuthInput`, `AuthButton` + telas `(auth)/login.tsx`, `(auth)/register.tsx`  
**Where:** `apps/mobile/components/auth/`, `apps/mobile/app/(auth)/`  
**Depends on:** T4  
**Reuses:** `Screen`, `theme.ts`, NativeWind classes  
**Requirements:** AUTH-04, AUTH-09, AUTH-10 (forms only; navigation em T6)

**Tools:**
- Skill: NONE

**Done when:**
- [ ] Login: email, password, link para register, submit chama `login()`
- [ ] Register: name, email, password, link para login, submit chama `register()`
- [ ] Tema dark: background `#0F172A`, primary `#8B5CF6`, tagline ASCEND
- [ ] Erros API exibidos inline (409, 400, 401)
- [ ] Gate check passes: `npm run build -w mobile`

**Tests:** none  
**Gate:** build

**Verify:**
```bash
npm run build -w mobile
# Manual: forms render, validation visible
```

**Commit:** `feat(mobile): add login and register screens`

---

### T6: Mobile AuthProvider & Session Routing

**What:** `AuthProvider`, `app/index.tsx` redirect, wrap root layout, Perfil com user + logout  
**Where:** `apps/mobile/providers/`, `apps/mobile/app/_layout.tsx`, `app/index.tsx`, `app/(tabs)/perfil.tsx`  
**Depends on:** T5  
**Reuses:** T4 auth lib, T5 auth screens  
**Requirements:** AUTH-04–05, AUTH-16–20, AUTH-26–29

**Tools:**
- Skill: NONE

**Done when:**
- [ ] Bootstrap: token → `GET /auth/me` → tabs; sem token → login
- [ ] Login/register success → `router.replace('/(tabs)')` + persist token
- [ ] Logout → clear SecureStore → `router.replace('/(auth)/login')`
- [ ] Perfil exibe name, email, botão logout
- [ ] Tabs inacessíveis sem auth (redirect)
- [ ] Gate check passes: `npm run build -w mobile`
- [ ] Manual UAT: register → restart app → still logged in → logout → login screen

**Tests:** none (manual UAT)  
**Gate:** build + manual

**Verify:**
```bash
# Terminal 1: npm run dev -w api
# Terminal 2: npm run dev -w mobile
# Register → Dashboard → Perfil (name/email) → kill app → reopen → tabs
# Logout → login screen
```

**Commit:** `feat(mobile): add auth provider session routing and profile logout`

---

### T7: Google Sign-In [P]

**What:** `POST /auth/google` na API + botão Google no mobile (`expo-auth-session`)  
**Where:** `apps/api/src/auth/`, `apps/mobile/components/auth/SocialAuthButtons.tsx`, login/register screens  
**Depends on:** T6  
**Reuses:** `AuthService.issueTokens`, `google-auth-library`  
**Requirements:** AUTH-30–34

**Tools:**
- Skill: NONE

**Done when:**
- [ ] API verifica Google ID token server-side (`GOOGLE_CLIENT_ID`)
- [ ] Novo user: cria com `google_id`; existente: link by email ou login
- [ ] Botão Google em login e register
- [ ] Invalid token → 401
- [ ] Gate check passes: `npm run test -w api` + `npm run build -w mobile`
- [ ] Manual: Google login em emulator/device (ou mock documentado)

**Tests:** unit (API verify mock) + manual (OAuth flow)  
**Gate:** quick + manual

**Verify:**
```bash
npm run test -w api
# Manual: Google sign-in → Perfil shows user
```

**Commit:** `feat(auth): add google sign-in`

---

### T8: Apple Sign-In (iOS) [P]

**What:** `POST /auth/apple` na API + botão Apple iOS-only (`expo-apple-authentication`)  
**Where:** `apps/api/src/auth/`, `apps/mobile/components/auth/SocialAuthButtons.tsx`  
**Depends on:** T6  
**Reuses:** Apple JWKS verify, `AuthService.issueTokens`  
**Requirements:** AUTH-35–39

**Tools:**
- Skill: NONE

**Done when:**
- [ ] API verifica Apple identity token (`APPLE_*` env vars)
- [ ] Novo user: `apple_id`; match by `apple_id` or email
- [ ] Botão Apple visível só no iOS; oculto no Android
- [ ] Invalid token → 401
- [ ] Gate check passes: `npm run test -w api` + `npm run build -w mobile`
- [ ] Manual: Apple login iOS simulator (ou skip note se sem Apple Dev account)

**Tests:** unit (API verify mock) + manual  
**Gate:** quick + manual

**Verify:**
```bash
npm run test -w api
# Manual iOS: Apple sign-in → authenticated session
```

**Commit:** `feat(auth): add apple sign-in for ios`

---

### T9: Refresh Tokens & Token Rotation

**What:** Model `RefreshToken`, migration, `POST /auth/refresh`, TTL access 15m, mobile auto-refresh  
**Where:** `apps/api/prisma/`, `apps/api/src/auth/`, `apps/mobile/lib/auth-storage.ts`, `apps/mobile/providers/AuthProvider.tsx`  
**Depends on:** T6, T7, T8  
**Reuses:** AuthService, SecureStore (refresh token key)  
**Requirements:** AUTH-40–43

**Tools:**
- MCP: `plugin-supabase-supabase`
- Skill: `supabase`

**Done when:**
- [ ] Migration `add_refresh_tokens` com hash SHA-256 (não plaintext)
- [ ] Login/register/OAuth retornam `{ accessToken, refreshToken, user }`
- [ ] `JWT_ACCESS_EXPIRES_IN` default → `15m`; `JWT_REFRESH_EXPIRES_IN` → `7d`
- [ ] `POST /auth/refresh` rotaciona token (one-time use)
- [ ] Mobile: on 401 tenta refresh 1x antes de logout
- [ ] Logout revoga refresh token na DB (P2 enhancement)
- [ ] Unit tests: refresh valid, expired, rotated
- [ ] Gate check passes: `npm run test -w api`

**Tests:** unit  
**Gate:** quick

**Verify:**
```bash
npm run test -w api
# Manual: wait/mock expiry → API call auto-refreshes
```

**Commit:** `feat(auth): add refresh token rotation`

---

### T10: CI JWT Env Stubs [P]

**What:** Adicionar `JWT_SECRET` stub (32+ chars) no job `api` do CI  
**Where:** `.github/workflows/ci.yml`  
**Depends on:** T3  
**Reuses:** Existing CI workflow from scaffolding  
**Requirements:** — (infra)

**Tools:**
- Skill: NONE

**Done when:**
- [ ] Job `api` define `JWT_SECRET` env stub
- [ ] `npm ci` + build + test passam no CI
- [ ] Gate check passes: `npm run lint && npm run build` localmente

**Tests:** none  
**Gate:** build

**Verify:**
```bash
npm run lint && npm run build
# Push → GitHub Actions api job green
```

**Commit:** `ci(auth): add jwt secret stub to api workflow`

---

### T11: Profile Update (PATCH /auth/me)

**What:** `PATCH /auth/me` { name } + UI editável na aba Perfil  
**Where:** `apps/api/src/auth/`, `apps/mobile/app/(tabs)/perfil.tsx`, `apps/mobile/lib/auth-api.ts`  
**Depends on:** T9  
**Reuses:** AuthService, AuthProvider user state  
**Requirements:** AUTH-44–46

**Tools:**
- Skill: NONE

**Done when:**
- [ ] `PATCH /auth/me` atualiza name; empty/ >100 chars → 400
- [ ] Perfil: campo editável + salvar; cache React Query/AuthProvider atualiza
- [ ] Unit test: updateProfile valid/invalid
- [ ] Gate check passes: `npm run test -w api` + `npm run build -w mobile`
- [ ] Manual: change name → restart app → name persists

**Tests:** unit  
**Gate:** quick

**Verify:**
```bash
npm run test -w api
# Manual: edit name on Perfil → persists after reload
```

**Commit:** `feat(auth): add profile name update`

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 ──→ T2 ──→ T3 ──→ T4 ──→ T5 ──→ T6

Phase 2 (after T6):
  Parallel batch A:
    T7 [P] Google
    T8 [P] Apple
    T10 [P] CI (also runnable after T3)
  Sequential:
    T7 + T8 ──→ T9 Refresh ──→ T11 Profile
```

**Parallelism notes:**
- T1: schema lock — never parallel com outras migrations
- T7/T8: parallel-safe (métodos OAuth distintos; coordenar merges em `auth.service.ts`)
- T10: parallel-safe (só CI yaml)
- T9: após T7/T8 para evitar conflitos em AuthService

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Prisma auth fields | 1 migration | ✅ Granular |
| T2: JWT env | 2 files config | ✅ Granular |
| T3: AuthModule + tests | 1 module coeso + unit tests | ✅ Granular |
| T4: Mobile auth lib | 3–4 lib files | ✅ Granular |
| T5: Auth UI screens | components + 2 screens | ✅ Granular |
| T6: AuthProvider + routing | provider + 3 app files | ✅ Granular |
| T7: Google OAuth | API + mobile button | ✅ Granular |
| T8: Apple OAuth | API + mobile button | ✅ Granular |
| T9: Refresh tokens | migration + API + mobile | ✅ Granular |
| T10: CI stub | 1 yaml | ✅ Granular |
| T11: Profile PATCH | endpoint + screen | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (body) | Diagram Shows | Status |
| ---- | ------------------- | ------------- | ------ |
| T1 | Scaffolding | T1 entry | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 [P] | ✅ Match |
| T8 | T6 | T6 → T8 [P] | ✅ Match |
| T9 | T6, T7, T8 | T7,T8 → T9 | ✅ Match |
| T10 | T3 | T6 → T10 [P] (also after T3) | ✅ Match |
| T11 | T9 | T9 → T11 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
| ---- | ---------- | --------------- | --------- | ------ |
| T1 | Prisma schema | none | none | ✅ OK |
| T2 | Env validation | none | none | ✅ OK |
| T3 | NestJS AuthModule | unit | unit | ✅ OK |
| T4 | Mobile lib | none | none | ✅ OK |
| T5 | Mobile UI | none | none | ✅ OK |
| T6 | Mobile provider/routing | none | none (manual UAT) | ✅ OK |
| T7 | OAuth API + mobile | unit + manual | unit + manual | ✅ OK |
| T8 | OAuth API + mobile | unit + manual | unit + manual | ✅ OK |
| T9 | AuthService refresh | unit | unit | ✅ OK |
| T10 | CI yaml | none | none | ✅ OK |
| T11 | AuthService PATCH | unit | unit | ✅ OK |

---

## Requirement Traceability

| Requirement ID | Task(s) | Status |
| -------------- | ------- | ------ |
| AUTH-01 – AUTH-05 | T3, T5, T6 | Mapped |
| AUTH-06 – AUTH-10 | T3, T5, T6 | Mapped |
| AUTH-11 – AUTH-15 | T2, T3 | Mapped |
| AUTH-16 – AUTH-20 | T4, T6 | Mapped |
| AUTH-21 – AUTH-25 | T3 | Mapped |
| AUTH-26 – AUTH-29 | T6 | Mapped |
| AUTH-30 – AUTH-34 | T7 | Mapped |
| AUTH-35 – AUTH-39 | T8 | Mapped |
| AUTH-40 – AUTH-43 | T9 | Mapped |
| AUTH-44 – AUTH-46 | T11 | Mapped |
| AUTH-47 – AUTH-49 | — (P3 deferred) | Deferred |

**Coverage:** 49 total, 46 mapped to tasks, 3 deferred (P3) ✅

---

## Task Status Tracker

| Task | Status | Commit | Notes |
| ---- | ------ | ------ | ----- |
| T1 | Pending | — | Prisma auth fields |
| T2 | Pending | — | JWT env validation |
| T3 | Pending | — | AuthModule + unit tests |
| T4 | Pending | — | Mobile auth lib |
| T5 | Pending | — | Login/register UI |
| T6 | Pending | — | AuthProvider + routing |
| T7 | Pending | — | Google OAuth [P] |
| T8 | Pending | — | Apple OAuth [P] |
| T9 | Pending | — | Refresh tokens |
| T10 | Pending | — | CI JWT stub [P] |
| T11 | Pending | — | Profile PATCH |

---

## MCPs & Skills for Execution

| Task | Recommended MCP/Skill |
| ---- | --------------------- |
| T1, T9 | `plugin-supabase-supabase` + skill `supabase` |
| T2–T8, T10–T11 | NONE (CLI padrão) |

**Available MCPs:** `plugin-supabase-supabase`  
**Available Skills:** `tlc-spec-driven`, `supabase`

---

## Success Criteria (from spec)

- [ ] P1 complete (T1–T6): register/login/me/logout/perfil + session persist
- [ ] P2 complete (T7–T11): OAuth + refresh + profile edit + CI
- [ ] `npm run test -w api` green with auth tests
- [ ] Manual UAT checklist passes (see T6 Verify)
