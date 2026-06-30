# OAuth Deferred — Google & Apple Sign-In

**Status:** Paused (retomar depois)  
**Updated:** 2026-06-30  
**Related tasks:** T7 (Google), T8 (Apple)

---

## Resumo

| Feature | Código | UAT manual | Status |
| ------- | ------ | ---------- | ------ |
| **Google Sign-In (T7)** | Implementado (API + mobile) | Bloqueado — erro `400: invalid_request` | **Aberto — retomar depois** |
| **Apple Sign-In (T8)** | Não iniciado | — | **Adiado — retomar depois** |

O fluxo **email/senha** (P1) está completo e operacional. OAuth social não bloqueia T9 (refresh tokens), T10 (CI) nem T11 (profile PATCH).

---

## T7 — Google Sign-In

### O que já está pronto

- `POST /auth/google` na API (`AuthService.loginWithGoogle`, `GoogleAuthService`)
- Botão "Continuar com Google" em login/register (`SocialAuthButtons.tsx`)
- Unit tests API (17 tests passando)
- Env vars documentadas em `apps/api/.env.example` e `apps/mobile/.env.example`

### Erro atual (UAT manual)

**Sintoma:** ao tocar "Continuar com Google", a tela do Google retorna:

```
400: invalid_request
```

**Quando ocorre:** na fase **OAuth do Google** (navegador/WebView), **antes** da chamada à API ASCEND. Não é erro 400 da API NestJS.

**Ambiente de teste:** Expo Go no Android (device/emulador), com:

```env
# apps/mobile/.env (configuração no momento do erro)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<web-client-id>.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=<android-client-id>.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=   # vazio
```

### Causa provável

1. **Expo Go + Android Client ID:** com `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` preenchido, o `useIdTokenAuthRequest` tenta fluxo nativo associado ao package `com.ascend.app` e SHA-1 do keystore local. No **Expo Go**, o app roda com o package do Expo Go — incompatível → Google responde `invalid_request`.

2. **Redirect URI não cadastrado:** no client **Web** do Google Cloud, falta o redirect do Expo Go:
   ```
   https://auth.expo.io/@<expo-username>/ascend
   ```
   (slug `ascend` vem de `apps/mobile/app.json`)

3. **SHA-1 / debug.keystore:** tentativa de obter SHA-1 falhou porque `~/.android/debug.keystore` ainda não existia (só é criado após `expo run:android` ou build Android local).

4. **OAuth consent screen:** app em "Testing" sem o Gmail do tester em **Test users** pode bloquear (erro diferente, mas verificar).

### Passos para retomar e resolver

#### A) Testar no Expo Go (rápido)

1. No `apps/mobile/.env`, usar **apenas** Web Client ID:
   ```env
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<web-id>.apps.googleusercontent.com
   # EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=   ← comentar
   # EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
   ```

2. Google Cloud Console → Credentials → **Web client** → Authorized redirect URIs:
   ```
   https://auth.expo.io/@<seu-usuario-expo>/ascend
   ```
   Descobrir usuário: `npx expo whoami`

3. OAuth consent screen → adicionar seu Gmail em **Test users**

4. Reiniciar Expo: `npx expo start -c`

5. Na API (`apps/api/.env`), incluir todos os client IDs que emitem tokens:
   ```env
   GOOGLE_CLIENT_IDS=<web-id>,<android-id>,<ios-id>
   ```

#### B) Testar com development build (produção-like)

1. Gerar `debug.keystore` (se não existir):
   ```bash
   npx expo run:android
   # ou keytool -genkey ... (ver sessão anterior)
   ```

2. Obter SHA-1 (Git Bash):
   ```bash
   "/c/Program Files/Java/jre-1.8/bin/keytool.exe" -list -v \
     -keystore "$HOME/.android/debug.keystore" \
     -alias androiddebugkey -storepass android -keypass android
   ```

3. Google Console → **Android client** → package `com.ascend.app` + SHA-1

4. Manter Web + Android client IDs no mobile `.env`

### Verificação de sucesso

- [ ] Google abre, login conclui sem `400`
- [ ] App redireciona para tabs autenticado
- [ ] Perfil mostra nome/email do Google
- [ ] `POST /auth/google` retorna 200 (não 401 Invalid Google token)

### Referências

- [Expo — Google authentication](https://docs.expo.dev/guides/google-authentication/)
- [Expo — AuthSession Google provider](https://docs.expo.dev/versions/latest/sdk/auth-session/#google)
- Código: `apps/mobile/components/auth/SocialAuthButtons.tsx`
- API: `apps/api/src/auth/google/google-auth.service.ts`

---

## T8 — Apple Sign-In

### Status

**Não iniciado.** Adiado conscientemente — não bloqueia P1 nem T9–T11.

### Escopo quando retomar

- `POST /auth/apple` na API (verify Apple identity token via JWKS)
- Botão Apple em `SocialAuthButtons.tsx` (iOS only, `expo-apple-authentication`)
- Env vars: `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, etc.
- Requisitos: AUTH-35–39

### Nota App Store

Se publicar na App Store **com** Google Sign-In, a Apple exige **Sign in with Apple**. Retomar T8 antes do release iOS.

---

## Impacto em outras tasks

| Task | Depende de T7/T8? | Pode seguir? |
| ---- | ----------------- | ------------ |
| T9 Refresh tokens | Planejamento citava T7+T8; tecnicamente só precisa T6 | ✅ Sim |
| T10 CI JWT stub | T3 | ✅ Sim |
| T11 Profile PATCH | T6 | ✅ Sim |

---

## Histórico

| Data | Evento |
| ---- | ------ |
| 2026-06-30 | T7 código mergeado; UAT Google bloqueado por `400: invalid_request` (Expo Go + OAuth config) |
| 2026-06-30 | T7 e T8 marcados como **abertos/adiados** — retomar OAuth depois |
