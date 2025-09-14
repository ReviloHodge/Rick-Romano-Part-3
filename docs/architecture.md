### Overview

This repository is a Next.js 14 app (App Router) with server routes under `app/api/*` and domain logic under `lib/*`.

- **Frontend**: React (app router) under `app/`
- **APIs**: Route handlers under `app/api/*`
- **Domain/Integrations**: `lib/providers/*`, `lib/http/*`, `lib/db.ts`, `lib/schemas.ts`
- **Tests**: Vitest in `tests/*` and `lib/**/__tests__/*`
- **E2E**: Playwright in `e2e/*`

### Entrypoints

- `pnpm dev` → Next dev server
- `pnpm build` → Next build
- `pnpm start` → Next start
- `pnpm test` → Typecheck + Vitest

### Environment Variables (currently referenced)

- Supabase
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE`
- Yahoo
  - `YAHOO_CLIENT_ID`
  - `YAHOO_CLIENT_SECRET`
  - `YAHOO_REDIRECT_URI` (no trailing slash)
- Optional
  - `MAKE_CONNECTOR_URL`

New standardized vars to be introduced by this work:

- Yahoo
  - `YAHOO_SCOPES` (default: `openid profile email fspt-r`)
  - `YAHOO_TOKEN_STORE` (default: `./.tokens/yahoo.json`)
- Sleeper
  - `SLEEPER_BASE_URL` (default: `https://api.sleeper.app/v1`)
  - `SLEEPER_LEAGUE_ID` (optional for doctor script)
- App
  - `PORT` (default: `3000`)
  - `NODE_ENV` (default: `development`)

### Where Yahoo/Sleeper clients live (current vs. new)

- Existing Sleeper code: `lib/providers/sleeper.ts`
  - Provides higher-level `getLeagueWeek()` and helpers
- Existing Yahoo code: `lib/providers/yahoo.ts`
  - OAuth helpers (`buildAuth`, `oauthExchange`, `refreshToken`) and data fetch/normalize

Additions in this effort (thin, reusable clients + diagnostics):

- `lib/config/env.ts` → typed env loader/validator
- `lib/integrations/sleeperClient.ts` → basic Sleeper fetches with retries
- `lib/integrations/yahooAuth.ts` → token file store + refresh
- `lib/integrations/yahooClient.ts` → bearer-injected client, minimal endpoints
- `lib/http/errors.ts` and `lib/logger.ts` → shared infra
- `scripts/sleeper.doctor.ts` and `scripts/yahoo.doctor.ts` → quick connectivity diagnostics

### Notable routes

- Existing: `/api/auth/yahoo` and `/api/auth/yahoo/callback` (Supabase-based storage)
- New (local file-storage OAuth): `/auth/yahoo/login`, `/auth/yahoo/callback`
- New diagnostics: `/healthz`, `/diagnostics`, `/debug/sleeper`, `/debug/yahoo/games`

