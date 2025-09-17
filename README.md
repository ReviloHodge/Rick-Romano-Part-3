# Rick Romano — clean starter
Minimal Next.js 14 + Tailwind starter with:
- `/` landing page
- `/api/ok` health route
- `/api/auth/sleeper` Sleeper OAuth redirect
- `/api/auth/yahoo` Yahoo OAuth redirect

## Env vars (Vercel → Project → Settings → Environment Variables)
- `KMS_KEY` — **required in all environments**; 32+ character key for encrypting tokens
- `SLEEPER_CLIENT_ID` / `SLEEPER_CLIENT_SECRET`
- `SLEEPER_REDIRECT_URI` — `https://<your-domain>/api/auth/sleeper`
- `YAHOO_CLIENT_ID` / `YAHOO_CLIENT_SECRET`
- `YAHOO_REDIRECT_URI` — `https://<your-domain>/api/auth/yahoo` (must match Yahoo Developer app, no trailing slash)
- Yahoo refresh tokens require adding `duration=permanent` to the Yahoo authorize URL
- `MAKE_CONNECTOR_URL` — your Make "connector.start" webhook URL
- (optional) `NEXT_PUBLIC_MAKE_CONNECTOR_URL` — same as above if you prefer exposing to client

## Deploy
1. Import repo into Vercel (Framework: Next.js)
2. Leave Root Directory blank (repo root)
3. Set env vars above and deploy
4. Test `/api/ok`, `/api/healthz`, and `/api/auth/yahoo`

## Quick start

1. Copy `.env.example` to `.env` and fill required values
2. Install deps: `pnpm install`
3. Dev server: `pnpm dev`
4. Sleeper doctor: `pnpm run doctor:sleeper -- --league <LEAGUE_ID>`
5. Yahoo OAuth: Visit `/auth/yahoo/login`, then `pnpm run doctor:yahoo`

