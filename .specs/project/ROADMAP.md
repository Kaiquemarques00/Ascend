# Roadmap

**Current Milestone:** M1 — Fundação
**Status:** Scaffolding complete → Authentication next

---

## M1 — Fundação

**Goal:** Monorepo configurado, app Expo navegável, API NestJS rodando, banco Supabase com schema base e autenticação funcional
**Target:** Semana 1

### Features

**Project Scaffolding** - ✅ COMPLETE → [spec](../features/scaffolding/spec.md) · [design](../features/scaffolding/design.md) · [tasks](../features/scaffolding/tasks.md)

- Estrutura monorepo (mobile + api)
- Expo app com TypeScript, NativeWind e React Query
- NestJS API com módulos base
- Supabase PostgreSQL com migrations iniciais
- CI básico e variáveis de ambiente documentadas
- README de onboarding (`/README.md`)

**Authentication** - PLANNED (next)

- Registro e login por email
- JWT session management
- Google e Apple login (OAuth)
- Perfil de usuário (`users`)

---

## M2 — Modelo de Dados Core

**Goal:** Usuário consegue organizar vida em áreas, definir objetivos e planejar tarefas
**Target:** Semana 2

### Features

**Life Areas** - PLANNED

- CRUD de áreas (nome, ícone, cor)
- Listagem com cards (nível + barra de progresso — UI placeholder até M4)
- Limite de 3 áreas no plano gratuito

**Goals** - PLANNED

- CRUD de objetivos vinculados a área
- Progresso percentual e data alvo
- Status (ativo, concluído, arquivado)
- Limite de 2 objetivos ativos no plano gratuito

**Daily Tasks** - PLANNED

- CRUD de tarefas vinculadas a objetivo
- Lista do dia com horário, prioridade e status
- Marcar como concluída

---

## M3 — Loop Diário

**Goal:** Fluxo completo de engajamento diário — energia → execução → reflexão
**Target:** Semana 3

### Features

**Onboarding** - PLANNED

- Perguntas iniciais (objetivo principal, áreas, tempo livre, o que está construindo)
- Criação guiada das primeiras áreas e objetivo

**Energy Check-in** - PLANNED

- Registro de energia (1–5) antes das atividades
- Exibição no dashboard (energia atual)
- Histórico em `energy_logs`

**Post-Task Reflection** - PLANNED

- Modal/fluxo após concluir tarefa
- Avanço percebido (muito/médio/pouco) e satisfação (excelente/bom/neutro/ruim)
- Nota opcional em `task_feedback`

**Dashboard** - PLANNED

- Resumo do dia (tarefas planejadas vs concluídas)
- Energia atual, momentum e evolução por área (dados reais conforme M4)

---

## M4 — Gamificação e Consistência

**Goal:** Usuário vê evolução tangível — XP, níveis, momentum e conquistas
**Target:** Semana 4

### Features

**XP & Leveling** - PLANNED

- XP por tarefa concluída, objetivo concluído e consistência
- Níveis por área (`area_progress`)
- Tela Evolução (XP bar, gráfico 7 dias, conquistas)

**Momentum (Streaks)** - PLANNED

- Streak por área (`streaks`) — reinicia ao interromper
- Tela Momentum com calendário visual de consistência
- Exibição no dashboard

**Achievements** - PLANNED

- Primeiro Passo (7 dias), Persistente (30 dias), Construtor (100 tarefas)
- Empreendedor (1º objetivo), Focado (5 objetivos)
- Desbloqueio automático e exibição na tela Evolução

---

## M5 — Insights, Equilíbrio e Polish

**Goal:** MVP completo, navegável e pronto para validação com usuários reais
**Target:** Semanas 5–6

### Features

**Balance Radar** - PLANNED

- Gráfico radar com atenção por área (%)
- Seção "Foco Recomendado" para áreas negligenciadas

**Basic Insights** - PLANNED

- Sugestões baseadas em regras (horário, tipo de tarefa, desequilíbrio)
- Tela Insights IA (sem LLM — heurísticas sobre dados do usuário)

**UI Polish** - PLANNED

- Dark theme conforme protótipo (navy, roxo, acentos funcionais)
- Bottom navigation (Dashboard, Áreas, Objetivos, Perfil)
- Componentes reutilizáveis (cards, progress bars, emoji scale)

**MVP Validation** - PLANNED

- Testes end-to-end do fluxo principal
- Correção de bugs críticos
- Deploy (Expo EAS + Railway/Render + Supabase)

---

## Future Considerations

- **Fase 2 — IA:** Mentor IA, planejamento automático, revisões semanais inteligentes, insights com LLM
- **Monetização:** Planos Pro (R$ 19,90) e Pro Plus (R$ 39,90) com billing
- **Notificações:** Push para lembretes de tarefas, streak em risco e conquistas
- **Weekly Reviews:** Revisão semanal guiada com reflexão e ajuste de metas
- **Sistema Operacional Pessoal:** Visão de longo prazo — assistente que entende, planeja e combate procrastinação
