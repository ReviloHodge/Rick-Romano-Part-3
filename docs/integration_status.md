### Setup and runs

- Installed deps: `pnpm install` (ok)
- Typecheck: `pnpm run typecheck` (ok)
- Tests: `pnpm test` (ok; 3 passing)
- Dev server: `pnpm dev` (started)

### Probed endpoints (local)

1) GET `/ok`
- Result: 404 Not Found (no route implemented)
- Reference: `README.md` suggests `/ok` exists, but no handler found under `app/ok/route.ts` or similar.

2) GET `/api/auth/yahoo?debug=1`
- Result: 500 Internal Server Error
- Likely cause: Env validation failure during Yahoo auth URL build.
- Code path: `lib/providers/yahoo.ts` → `buildAuth()` calls `validateEnv(YAHOO_ENV_VARS)`.
  - Missing required envs: `YAHOO_CLIENT_ID`, `YAHOO_CLIENT_SECRET`, `YAHOO_REDIRECT_URI`.

3) POST `/api/providers/sleeper/week` with `{}`
- Result: 500 Internal Server Error
- Expected: 400 with validation error when `leagueId` is missing.
- Code path: `app/api/providers/sleeper/week/route.ts` lines 7–12
  - `Body.parse(body)` throws ZodError; not caught, so Next returns 500.

### Current integration gaps

- No standardized env loader or `.env.example`.
- Sleeper integration exists in `lib/providers/sleeper.ts`, but there is no simple CLI/doctor for connectivity.
- Yahoo OAuth endpoints exist under `/api/auth/yahoo`, persisting tokens to Supabase. Requested flow requires local file token store and `/auth/yahoo/*` routes.
- Health and diagnostics endpoints (`/healthz`, `/diagnostics`, `/debug/*`) are not present.

### Next steps (tracked in TODOs)

- Add env loader and `.env.example`.
- Provide `sleeperClient` and `scripts/sleeper.doctor.ts`.
- Provide `yahooAuth` file-store, `/auth/yahoo/*`, `yahooClient`, and `scripts/yahoo.doctor.ts`.
- Implement `/healthz`, `/diagnostics`, and `/debug/*` routes.

