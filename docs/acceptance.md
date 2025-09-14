### Sleeper Definition of Done

- `pnpm run doctor:sleeper` exits 0 and prints counts and samples for league/users/rosters/matchups
- `POST /api/providers/sleeper/week` with a valid `leagueId` returns 200 and normalized data

### Yahoo Definition of Done

- Visiting `/auth/yahoo/login` completes OAuth locally and writes `.tokens/yahoo.json`
- `pnpm run doctor:yahoo` exits 0 and prints at least one game
- Forcing expiry in the token file and re-running doctor transparently refreshes token

### App Definition of Done

- `pnpm dev` or `pnpm start` boots with no unhandled rejections
- `GET /api/healthz` returns 200 within 200ms locally
- `GET /api/diagnostics` shows env presence, disk write, and outbound OK

