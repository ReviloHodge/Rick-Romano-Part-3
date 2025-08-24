# Rick Romano — clean starter
Minimal Next.js 14 + Tailwind starter with:
- `/` landing page
- `/ok` health route
- `/api/yahoo/start` Yahoo OAuth redirect
- `/api/yahoo/callback` posts `{ provider:'yahoo', code }` to Make.com webhook

## Env vars (Vercel → Project → Settings → Environment Variables)
- `YAHOO_CLIENT_ID` — from Yahoo Developer app
- `YAHOO_REDIRECT_URI` — `https://<your-vercel-domain>/api/yahoo/callback`
- `MAKE_CONNECTOR_URL` — your Make "connector.start" webhook URL
- (optional) `NEXT_PUBLIC_MAKE_CONNECTOR_URL` — same as above if you prefer exposing to client

## Deploy
1. Import repo into Vercel (Framework: Next.js)
2. Leave Root Directory blank (repo root)
3. Set env vars above and deploy
4. Test `/ok` and `/api/yahoo/start`
