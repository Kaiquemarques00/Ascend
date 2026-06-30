# OAuth — Google & Apple Sign-In (em breve)

**Status:** Adiado — será adicionado em breve  
**Updated:** 2026-06-30  
**Related tasks:** T7 (Google), T8 (Apple)

---

## Resumo

| Feature | Status |
| ------- | ------ |
| **Google Sign-In (T7)** | **Em breve** — código removido; UI mostra placeholder |
| **Apple Sign-In (T8)** | **Em breve** — não iniciado |

O fluxo **email/senha** (P1) está completo e operacional: registro, login, refresh tokens, logout e edição de perfil.

Login social **não bloqueia** as demais tasks de autenticação (T9–T11).

---

## O que existe hoje

### Mobile

- Telas de login e register exibem `SocialAuthComingSoon` com a mensagem:
  **"Login com Google e Apple — em breve"**
- Componente: `apps/mobile/components/auth/SocialAuthComingSoon.tsx`

### API

- Sem endpoints OAuth (`POST /auth/google` e `POST /auth/apple` serão adicionados depois)
- Contas criadas apenas com email/senha
- Se um usuário OAuth-only tentar login por email, a API retorna mensagem indicando que login social ainda não está disponível

### Banco de dados

- Campos `google_id` e `apple_id` permanecem no schema Prisma para uso futuro

---

## Escopo quando retomar

### T7 — Google Sign-In

- `POST /auth/google` na API (verificação server-side do ID token)
- Botão "Continuar com Google" em login/register
- Env vars: `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_IDS` (API), client IDs no mobile
- Requisitos: AUTH-30–34

### T8 — Apple Sign-In

- `POST /auth/apple` na API (verify Apple identity token via JWKS)
- Botão Apple em iOS (`expo-apple-authentication`)
- Env vars: `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, etc.
- Requisitos: AUTH-35–39

**Nota App Store:** se o app publicar com Google Sign-In, a Apple exige **Sign in with Apple**. Implementar T8 antes do release iOS.

---

## Histórico

| Data | Evento |
| ---- | ------ |
| 2026-06-30 | T7 implementado; UAT bloqueado por config OAuth |
| 2026-06-30 | Decisão AD-008: adiar OAuth e seguir com T9–T11 |
| 2026-06-30 | Código Google removido; Google e Apple marcados como **em breve** na UI e docs |
