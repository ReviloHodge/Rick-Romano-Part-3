#!/usr/bin/env tsx
import { getEnv } from '../lib/config/env';
import { getLeague, getUsers, getRosters, getMatchups } from '../lib/integrations/sleeperClient';

async function main() {
  const args = process.argv.slice(2);
  const flagIdx = args.findIndex(a => a === '--league' || a === '-l');
  const leagueFromFlag = flagIdx >= 0 ? args[flagIdx + 1] : undefined;
  const env = getEnv();
  const leagueId = leagueFromFlag || env.SLEEPER_LEAGUE_ID;
  if (!leagueId) {
    console.error('Missing league id. Use --league <id> or set SLEEPER_LEAGUE_ID in .env');
    process.exit(2);
  }

  const weekArgIdx = args.findIndex(a => a === '--week' || a === '-w');
  const week = weekArgIdx >= 0 ? Number(args[weekArgIdx + 1]) : 1;

  try {
    const league = await getLeague(leagueId);
    const users = await getUsers(leagueId);
    const rosters = await getRosters(leagueId);
    const matchups = await getMatchups(leagueId, week);

    console.log(JSON.stringify({
      ok: true,
      league: { id: league.league_id, name: league.name, season: league.season },
      counts: { users: users.length, rosters: rosters.length, matchups: matchups.length },
      samples: {
        user: users[0] ?? null,
        roster: rosters[0] ?? null,
        matchup: matchups[0] ?? null,
      },
    }, null, 2));
    process.exit(0);
  } catch (err: any) {
    console.error('Sleeper doctor failed:', err?.message || err);
    process.exit(1);
  }
}

main();

