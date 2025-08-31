// lib/providers/sleeper.ts

const API = "https://api.sleeper.app/v1";

/**
 * Try to extract a Sleeper leagueId from a URL or raw input.
 * Accepts:
 *  - https://sleeper.app/leagues/<id>
 *  - any URL with ?leagueId=<id>
 *  - raw numeric ID
 */
export function parseSleeperInput(input: string): string | null {
  const trimmed = input.trim();

  // URL patterns
  try {
    const url = new URL(trimmed);
    const pathMatch = url.pathname.match(/\/league[s]?\/(\d+)/i);
    if (pathMatch?.[1]) return pathMatch[1];
    const qId = url.searchParams.get("leagueId");
    if (qId) return qId;
  } catch {
    // not a URL; fall through
  }

  // Raw numeric ID (Sleeper league IDs are long ints)
  if (/^\d{6,}$/.test(trimmed)) return trimmed;

  return null;
}

/**
 * Username -> leagues for a given NFL season (public endpoints).
 */
export async function getLeaguesForUsername(username: string, season: number) {
  const userRes = await fetch(`${API}/user/${encodeURIComponent(username)}`);
  if (!userRes.ok) return [];
  const user = await userRes.json();
  if (!user?.user_id) return [];

  const leaguesRes = await fetch(`${API}/user/${user.user_id}/leagues/nfl/${season}`);
  if (!leaguesRes.ok) return [];
  return leaguesRes.json();
}

/**
 * listLeagues (no OAuth): alias to username+season lookup.
 * Keep this name to satisfy any existing imports that expect `listLeagues(...)`.
 */
export async function listLeagues(username: string, season: number) {
  return getLeaguesForUsername(username, season);
}

/**
 * Fetch basic league metadata (validates the league exists).
 */
export async function fetchSleeperLeagueMeta(leagueId: string) {
  const res = await fetch(`${API}/league/${leagueId}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

/**
 * Fetch week data for a league. Returns a normalized shape that downstream
 * code can rely on (league, matchups, rosters, transactions stubs).
 */
export async function getLeagueWeekData(leagueId: string, week: number) {
  const [leagueRes, matchupRes, rosterRes, txRes] = await Promise.all([
    fetch(`${API}/league/${leagueId}`),
    fetch(`${API}/league/${leagueId}/matchups/${week}`),
    fetch(`${API}/league/${leagueId}/rosters`),
    // Transactions can be fetched per week; if unavailable, return empty.
    fetch(`${API}/league/${leagueId}/transactions/${week}`).catch(() => null),
  ]);

  if (!leagueRes.ok || !matchupRes.ok || !rosterRes.ok) {
    throw new Error("sleeper_fetch_failed");
  }

  const league = await leagueRes.json();
  const matchups = await matchupRes.json();
  const rosters = await rosterRes.json();
  const transactions = txRes && txRes.ok ? await txRes.json() : [];

  // Minimal normalized snapshot; expand as needed by your analysis layer
  return {
    week,
    provider: "sleeper" as const,
    league_id: league.league_id,
    league_name: league.name,
    season: league.season,
    total_rosters: league.total_rosters,
    matchups,
    rosters,
    transactions, // raw tx array; your analysis can split into waivers/trades/etc.
  };
}
