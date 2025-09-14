### Yahoo OAuth setup

1) Create a Yahoo Developer application
   - Go to `https://developer.yahoo.com/apps/`
   - Create a new app (Web)
   - Add Redirect URI: `http://localhost:3000/auth/yahoo/callback` (exactly)
   - Save Client ID and Client Secret

2) Configure .env

Copy `.env.example` to `.env` and set:

```
YAHOO_CLIENT_ID=your_client_id
YAHOO_CLIENT_SECRET=your_secret
YAHOO_REDIRECT_URI=http://localhost:3000/auth/yahoo/callback
YAHOO_SCOPES=openid profile email fspt-r
YAHOO_TOKEN_STORE=./.tokens/yahoo.json
```

3) Run the app and complete consent

- Start dev server: `pnpm dev`
- Visit `/auth/yahoo/login` in your browser and complete consent
- On success, a token file will be written at `.tokens/yahoo.json`

4) Verify with doctor script

- Run: `pnpm run doctor:yahoo`
- Expected: prints non-empty `games` sample

Notes
- If you change Redirect URI in Yahoo, update `.env` to match exactly
- Ensure `duration=permanent` is used; we set this automatically in the authorize URL

