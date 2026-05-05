# Capacitor WebView pointed at Next dev server triggers CORS by exact origin (including port)

**Date**: 2026-05-05
**Area**: frontend | infra

## Finding
When `capacitor.config.ts` sets `server.url = 'http://localhost:3001/'`, the iOS/Android WebView loads the Next dev server directly and every `fetch()` to the backend carries `Origin: http://localhost:3001` — **with the port**.

The backend CORS allowlist hardcoded `['capacitor://localhost', 'https://localhost', 'http://localhost']` (no port). For browsers/WebView CORS, `http://localhost` and `http://localhost:3001` are different origins, so requests were rejected even though "localhost" was in the list.

Fix landed in `backend-v2/src/main.ts` — `capacitorOrigins` now also includes `http://localhost:3000` and `http://localhost:3001` so a Capacitor build pointed at the local Next dev server passes CORS without an env edit.

Also note: `CapacitorHttp.enabled: false` is intentional (`capacitor.config.ts:78-80`). When enabled, it intercepts every `fetch()` and routes through native URLSession, which silently fails on iOS Simulator (`CapacitorUrlRequestError error 0`) and bypasses WebView cookie storage. The interceptor URL pattern `capacitor://localhost/_capacitor_http_interceptor_?u=...` is the giveaway that it's active — if you see it, confirm the plugin is actually disabled in the synced native build (`npx cap sync ios`).

## Why it matters
- Saves the next person from chasing "but localhost IS in the CORS list" — port matters.
- Documents the dev-loop topology: WebView → `http://localhost:3001` (Next) → `http://localhost:3000` (Nest API). Adding new local ports to the dev rig means adding them to `capacitorOrigins` too.
- Records why `CapacitorHttp` is off, so a future change doesn't flip it back without understanding the iOS Simulator failure mode.

## Context / how it was found
User hit CORS preflight failures from an iOS Simulator build. The failing curl revealed `Origin: http://localhost:3001` while the backend allowlist only had `http://localhost`. Confirmed by reading `capacitor.config.ts:50` (`remoteUrl` default) and `backend-v2/src/main.ts:64` (capacitorOrigins).
