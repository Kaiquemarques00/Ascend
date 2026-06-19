# ASCEND

**Vision:** Plataforma de produtividade e evolução pessoal que transforma ações diárias em progresso visível — respondendo "Estou realmente evoluindo na direção da vida que quero?"
**For:** Empreendedores solo, desenvolvedores, freelancers, criadores de conteúdo e estudantes ambiciosos que buscam consistência e evolução real (persona inicial: Kaique, 22 anos)
**Solves:** Falta de consistência, procrastinação, dificuldade em priorizar, sensação de não evoluir e desequilíbrio entre áreas da vida — problemas que apps de tarefas e habit trackers não resolvem sozinhos

**Tagline:** Consistência que transforma

**Referências:**
- Especificação completa: [`ascend.md`](../../ascend.md)
- Protótipo de interface: [`interface.png`](../../interface.png) — dark theme navy/roxo, cards arredondados, barras de progresso e navegação inferior (Dashboard, Áreas, Objetivos, Perfil)

## Goals

- **Validar o MVP em 4–6 semanas:** usuários acompanham evolução e consistência de forma inteligente, com retenção medida por dias consistentes (North Star Metric)
- **Fechar o loop diário:** planejar → check-in de energia → executar tarefas → refletir → ganhar XP → manter momentum
- **Demonstrar evolução por área:** XP, níveis e radar de equilíbrio tornam o progresso tangível, não apenas tarefas marcadas

## Tech Stack

**Core:**

- Mobile: React Native + Expo (TypeScript)
- Backend: NestJS (TypeScript)
- Database: PostgreSQL (Supabase)
- Auth: JWT + Google, Apple e Email login
- Styling: NativeWind
- Data fetching: React Query

**Key dependencies:**

- Expo EAS (build/deploy mobile)
- Supabase (PostgreSQL + auth helpers)
- Railway ou Render (hosting backend)

## Scope

**v1 (MVP) includes:**

- Onboarding inicial (objetivo principal, áreas importantes, tempo livre)
- Áreas da vida (CRUD, ícone, cor, XP/nível por área)
- Objetivos vinculados a áreas (progresso, data alvo, status)
- Tarefas do dia vinculadas a objetivos (criar, editar, concluir)
- Check-in de energia (escala 1–5, antes das atividades)
- Reflexão pós-tarefa (avanço percebido, satisfação, nota opcional)
- Sistema de momentum (streak por área, reinicia ao interromper)
- Sistema de evolução (XP por tarefa/objetivo/consistência, níveis por área)
- Conquistas básicas (Primeiro Passo, Persistente, Construtor, Empreendedor, Focado)
- Dashboard (energia, tarefas do dia, momentum, evolução por área)
- Telas: Áreas, Objetivos, Tarefas, Evolução, Momentum, Radar de Equilíbrio
- Insights básicos (regras/heurísticas sobre desequilíbrio e padrões simples)
- Autenticação e perfil de usuário
- Limites do plano gratuito (3 áreas, 2 objetivos ativos)

**Explicitly out of scope (v1):**

- IA avançada (mentor, planejamento automático, revisões inteligentes) — Fase 2
- Monetização e billing (Pro / Pro Plus) — após validação do MVP
- Notificações push completas
- Revisões semanais com IA
- Relatórios avançados
- Histórico completo ilimitado (feature Pro)
- Web app / desktop

## Constraints

- **Timeline:** 4–6 semanas para MVP validável
- **Technical:** Mobile-first (Expo), API REST NestJS, schema PostgreSQL conforme `ascend.md`
- **Resources:** Projeto solo/inicial — priorizar loop core sobre polish e features secundárias
- **Design:** Seguir protótipo dark theme (navy, roxo, verde/laranja/amarelo funcionais)

## Filosofia do Produto

- Consistência vale mais que intensidade
- Evolução vale mais que horas
- Reflexão vale mais que produtividade cega
- Pequenos avanços geram grandes resultados

## Métricas

| Métrica | Tipo |
|---------|------|
| Dias Consistentes | North Star |
| Usuários ativos, sequência média, objetivos concluídos, retenção, XP médio | Secundárias |
