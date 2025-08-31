import { League, Snapshot } from '../types';

const API = 'https://api.sleeper.app/v1';

export async function getUser(accessToken: string) {
  const res = await fetch(`${API}/user/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('sleeper getUser failed');
  return res.json();
}

export async function listLeagues(accessToken: string): Promise<League[]> {
  // Sleeper leagues are mostly public; accessToken retained for future use
  const user = await getUser(accessToken);
  const season = new Date().getFullYear();
  const res = await fetch(`${API}/user/${user.user_id}/leagues/nfl/${season}`);
  if (!res.ok) throw new Error('sleeper listLeagues failed');
  const leagues = await res.json();
  return leagues.map((l: any) => ({
    league_id: l.league_id,
    name: l.name,
    season: l.season,
  }));
}

export async function getLeagueWeekData(
  leagueId: string,
  week: number
): Promise<Snapshot> {
  const [leagueRes, matchupRes, rosterRes] = await Promise.all([
    fetch(`${API}/league/${leagueId}`),
    fetch(`${API}/league/${leagueId}/matchups/${week}`),
    fetch(`${API}/league/${leagueId}/rosters`),
  ]);
  const league = await leagueRes.json();
  const matchups = await matchupRes.json();
  const rosters = await rosterRes.json();
  return {
    week,
    league_name: league.name,
    teams: [], // TODO normalize rosters
    matchups: [], // TODO normalize matchups
    transactions: { waivers: [], trades: [], injuries: [] },
  };
}
