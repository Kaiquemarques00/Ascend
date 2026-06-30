# State

**Last Updated:** 2026-06-30
**Current Work:** M1 — Authentication T9 complete; próximo: T10 CI ou retomar OAuth (T7/T8)

---

## Recent Decisions (Last 60 days)

### AD-001: TLC Spec-Driven como metodologia de desenvolvimento (2026-06-19)

**Decision:** Usar tlc-spec-driven para planejar e implementar o ASCEND
**Reason:** Projeto novo com escopo MVP definido; metodologia garante rastreabilidade, tarefas atômicas e memória entre sessões
**Trade-off:** Overhead inicial de documentação em `.specs/`
**Impact:** Cada feature seguirá Specify → (Design) → (Tasks) → Execute conforme complexidade

### AD-002: Stack conforme ascend.md (2026-06-19)

**Decision:** React Native/Expo + NestJS + Supabase PostgreSQL
**Reason:** Já definido na especificação do produto; alinha mobile-first com backend tipado e Postgres gerenciado
**Trade-off:** Monorepo com duas stacks; curva de setup inicial
**Impact:** M1 foca em scaffolding desta stack

### AD-003: Insights rule-based no MVP (2026-06-19)

**Decision:** Insights no MVP serão baseados em regras/heurísticas; LLM e mentor IA ficam para Fase 2
**Reason:** `ascend.md` marca IA avançada como Fase 2; MVP deve validar loop core em 4–6 semanas
**Trade-off:** Tela "Insights IA" terá sugestões mais simples inicialmente
**Impact:** M5 implementa insights rule-based, não integração OpenAI/Anthropic

### AD-004: Decisões de arquitetura do scaffolding (2026-06-19)

**Decision:** npm workspaces, Prisma 6.x, Expo SDK 54 + NativeWind 4.2.1 pinado, mobile → API only
**Reason:** Simplicidade para solo dev; Prisma 6 tem `directUrl` nativo para Supabase; SDK 54 alinha com Expo Go atual
**Trade-off:** Sem `packages/shared` inicial; Reanimated v4 exige NativeWind 4.2.1+ na T9
**Impact:** Design em `.specs/features/scaffolding/design.md`; 12 tarefas de implementação planejadas

### AD-005: Upgrade Expo SDK 52 → 54 (2026-06-23)

**Decision:** Subir `apps/mobile` para Expo SDK 54 (React Native 0.81, React 19, Expo Router ~6)
**Reason:** Expo Go no dispositivo do dev suporta apenas SDK 54; SDK 52 era incompatível
**Trade-off:** Node mínimo sobe para 20.19.4; NativeWind na T9 deve usar Reanimated v4
**Impact:** `.nvmrc`, `package.json` engines e docs de scaffolding atualizados

### AD-006: Node.js 20.19.4+ no ambiente local (2026-06-23)

**Decision:** Exigir Node **≥20.19.4** (`.nvmrc` pinado em `20.19.4`; ambiente local atualizado para 20.20.2 via winget)
**Reason:** Metro e React Native 0.81 do Expo SDK 54 exigem Node ≥20.19.4
**Trade-off:** Devs em Node 20.17 precisam atualizar antes de `expo start`
**Impact:** `engines` no root `package.json`, CI (T11) e prerequisites do README

### AD-007: Scaffolding M1 concluído (2026-06-25)

**Decision:** Encerrar feature Project Scaffolding (T1–T12) e iniciar Authentication como próxima feature
**Reason:** Ambiente validado localmente (install → env → migrate → dev → health → mobile tabs + API status); CI lint + build configurado; README de onboarding publicado
**Trade-off:** Husky pre-commit (T2b) permanece opcional e não implementado
**Impact:** ROADMAP marca scaffolding como COMPLETE; specs atualizadas para status Complete

### AD-008: OAuth Google/Apple adiado (2026-06-30)

**Decision:** Remover implementação parcial do Google Sign-In; adiar Google (T7) e Apple (T8); UI com placeholder "em breve"
**Reason:** Config OAuth complexa (Google Cloud, SHA-1, development builds); priorizar fluxo email/senha estável
**Trade-off:** P2 OAuth incompleto até retomar; login email/senha + sessão permanecem MVP
**Impact:** Documentado em `.specs/features/authentication/deferred-oauth.md`; T9–T11 concluídos sem OAuth

---

## Active Blockers

_Nenhum bloqueador ativo._

**Em breve (não bloqueia):** Google Sign-In (T7) e Apple Sign-In (T8) — ver `deferred-oauth.md`

---

## Lessons Learned

### LL-001: Artefatos temporários de bootstrap (2026-06-25)

**Context:** Pasta `.tmp-expo-ref` (Expo SDK 56) criada durante exploração do CLI na T8
**Lesson:** Remover referências temporárias ao concluir a task; não commitar no repositório
**Applied:** Pasta removida; entrada em `.gitignore`

### LL-002: ESLint em arquivos `*.config.js` (2026-06-25)

**Context:** CI (T11) falhava em `jest.config.js`, `babel.config.js`, `metro.config.js`, `tailwind.config.js`
**Lesson:** Ignorar `**/*.config.js` no ESLint flat config ou definir ambiente Node para esses arquivos
**Applied:** `eslint.config.mjs` atualizado com ignore

---

## Quick Tasks Completed

| #   | Description                              | Date       | Commit | Status  |
| --- | ---------------------------------------- | ---------- | ------ | ------- |
| —   | Inicialização do projeto (PROJECT + ROADMAP + STATE) | 2026-06-19 | —      | ✅ Done |
| —   | Project Scaffolding (T1–T12)             | 2026-06-25 | —      | ✅ Done |

---

## Deferred Ideas

- [ ] Integração com calendário externo (Google Calendar) — Captured during: project init
- [ ] Modo offline com sync — Captured during: project init
- [ ] Compartilhamento de conquistas em redes sociais — Captured during: project init
- [ ] Google Sign-In (T7) — **em breve** — ver `.specs/features/authentication/deferred-oauth.md`
- [ ] Apple Sign-In (T8) — **em breve** — retomar antes de release iOS com login social
- [ ] Husky + lint-staged pre-commit (T2b) — Captured during: scaffolding complete

---

## Todos

- [x] Especificar feature M1 (Project Scaffolding) — `.specs/features/scaffolding/spec.md`
- [x] Copiar/referenciar `interface.png` no repositório para acesso local
- [x] Tasks scaffolding — `.specs/features/scaffolding/tasks.md` (12 tasks)
- [x] Implementar T1–T12 — scaffolding completo e validado
- [x] Especificar feature Authentication — `.specs/features/authentication/spec.md`
- [x] Design feature Authentication — `.specs/features/authentication/design.md`
- [x] Tasks feature Authentication — `.specs/features/authentication/tasks.md`
- [x] Implementar T1–T6 Authentication — P1 core auth completo
- [ ] Implementar T9–T11 (refresh, CI, profile) — OAuth T7/T8 pausado

---

## Preferences

**Model Guidance Shown:** never
