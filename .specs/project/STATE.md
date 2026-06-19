# State

**Last Updated:** 2026-06-19
**Current Work:** M1 — Project Scaffolding (T2 complete → T3/T8 next)

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

### AD-004: Decisões de arquitetura do scaffolding (2026-06-19)

**Decision:** npm workspaces, Prisma 6.x, Expo SDK 52 + NativeWind 4.2.1 pinado, mobile → API only
**Reason:** Simplicidade para solo dev; Prisma 6 tem `directUrl` nativo para Supabase; NativeWind tem histórico de incompatibilidade entre SDKs
**Trade-off:** Sem `packages/shared` inicial; upgrade de SDK avaliado em M5
**Impact:** Design em `.specs/features/scaffolding/design.md`; 7 tarefas de implementação planejadas

---

**Decision:** Insights no MVP serão baseados em regras/heurísticas; LLM e mentor IA ficam para Fase 2
**Reason:** `ascend.md` marca IA avançada como Fase 2; MVP deve validar loop core em 4–6 semanas
**Trade-off:** Tela "Insights IA" terá sugestões mais simples inicialmente
**Impact:** M5 implementa insights rule-based, não integração OpenAI/Anthropic

---

## Active Blockers

_Nenhum bloqueador ativo._

---

## Lessons Learned

_Nenhuma lição registrada ainda._

---

## Quick Tasks Completed

| #   | Description                              | Date       | Commit | Status  |
| --- | ---------------------------------------- | ---------- | ------ | ------- |
| —   | Inicialização do projeto (PROJECT + ROADMAP + STATE) | 2026-06-19 | —      | ✅ Done |

---

## Deferred Ideas

- [ ] Integração com calendário externo (Google Calendar) — Captured during: project init
- [ ] Modo offline com sync — Captured during: project init
- [ ] Compartilhamento de conquistas em redes sociais — Captured during: project init

---

## Todos

- [x] Especificar feature M1 (Project Scaffolding) — `.specs/features/scaffolding/spec.md`
- [x] Copiar/referenciar `interface.png` no repositório para acesso local
- [x] Tasks scaffolding — `.specs/features/scaffolding/tasks.md` (12 tasks)
- [x] Implementar T1 — monorepo root structure
- [x] Implementar T2 — shared dev tooling
- [ ] Implementar T3 ou trilha paralela — `implement scaffolding T3`

---

## Preferences

**Model Guidance Shown:** never
