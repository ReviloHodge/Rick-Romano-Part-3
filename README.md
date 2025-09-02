# Rick Romano — clean starter
Minimal Next.js 14 + Tailwind starter with:
- `/` landing page
- `/ok` health route
- `/api/auth/sleeper` Sleeper OAuth redirect
- `/api/auth/yahoo` Yahoo OAuth redirect

## Env vars (Vercel → Project → Settings → Environment Variables)
- `SLEEPER_CLIENT_ID` / `SLEEPER_CLIENT_SECRET`
- `SLEEPER_REDIRECT_URI` — `https://<your-domain>/api/auth/sleeper`
- `YAHOO_CLIENT_ID` / `YAHOO_CLIENT_SECRET`
- `YAHOO_REDIRECT_URI` — `https://<your-domain>/api/auth/yahoo` (must match Yahoo Developer app)
- `MAKE_CONNECTOR_URL` — your Make "connector.start" webhook URL
- (optional) `NEXT_PUBLIC_MAKE_CONNECTOR_URL` — same as above if you prefer exposing to client

## Deploy
1. Import repo into Vercel (Framework: Next.js)
2. Leave Root Directory blank (repo root)
3. Set env vars above and deploy
4. Test `/ok` and `/api/auth/yahoo`
