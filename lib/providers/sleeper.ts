// lib/providers/sleeper.ts

const API = "https://api.sleeper.app/v1";

/**
 * Get all leagues for a given Sleeper username in a specific season.
 */
export async function getLeaguesForUsername(username: string, season: number) {
  const userRes = await fetch(`${API}/user/${encodeURIComponent(username)}`);
  if (!userRes.ok) throw new Error("failed_to_fetch_user");
  const user = await userRes.json();
  if (!user?.user_id) return [];

  const leaguesRes = await fetch(
    `${API}/user/${user.user_id}/leagues/nfl/${season}`
  );
  if (!leaguesRes.ok) throw new Error("failed_to_fetch_leagues");
  return leaguesRes.json();
}

/**
 * listLeagues: simple wrapper to fetch leagues for a user+season.
 * Kept as a separate export to match existing call sites.
 */
export async function listLeagues(username: string, season: number) {
  return getLeaguesForUsername(username, season);
}

/**
 * Fetch matchup data for a given league/week.
 * Returns the raw JSON response (normalization is done downstream).
 */
export async function getLeagueWeekData(leagueId: string, week: number) {
  const url = `${API}/league/${leagueId}/matchups/${week}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("failed_to_fetch_week_data");
  return res.json();
}
