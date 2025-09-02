import { safeFetch } from "../http/safeFetch";
import {
  ZSleeperUser,
  ZSleeperLeague,
  ZSleeperMatchup,
  ZSleeperRoster,
  ZSleeperUserMap,
  ZMatchupWeek,
} from "../schemas";
import type { LeagueMeta, MatchupWeek, Team, RosterSpot, Matchup } from "../../types/domain";
import { z } from "zod";

const API = "https://api.sleeper.app/v1";

export async function getUserIdByUsername(username: string): Promise<string> {
  const json = await safeFetch(`${API}/user/${encodeURIComponent(username)}`);
  const parsed = ZSleeperUser.parse(json);
  return parsed.user_id;
}

export async function getLeaguesForUser(
  userId: string,
  season: number
): Promise<LeagueMeta[]> {
  const json = await safeFetch(`${API}/user/${userId}/leagues/nfl/${season}`);
  const leagues = z.array(ZSleeperLeague).parse(json);
  return leagues.map((l: z.infer<typeof ZSleeperLeague>) => ({
    platform: "sleeper" as const,
    leagueId: l.league_id,
    season: l.season,
    name: l.name,
  }));
}

export function resolveLastCompletedWeek(
  season: number,
  now: Date = new Date()
): number {
  const seasonStart = new Date(Date.UTC(season, 8, 7)); // Sep 7 approx week1 start
  const diff = now.getTime() - seasonStart.getTime();
  if (diff < 0) return 0;
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  let week = Math.floor(diff / weekMs) + 1;
  const day = now.getUTCDay();
  if (day === 0 || day === 1 || (day === 2 && now.getUTCHours() < 8)) {
    week -= 1;
  }
  if (week < 0) week = 0;
  if (week > 18) week = 18;
  return week;
}

export async function getLeagueWeek(leagueId: string, week: number) {
  const [leagueJson, matchupsJson, rostersJson, usersJson] = await Promise.all([
    safeFetch(`${API}/league/${leagueId}`),
    safeFetch(`${API}/league/${leagueId}/matchups/${week}`),
    safeFetch(`${API}/league/${leagueId}/rosters`),
    safeFetch(`${API}/league/${leagueId}/users`),
  ]);

  const leagueParsed = ZSleeperLeague.pick({
    league_id: true,
    name: true,
    season: true,
  }).parse(leagueJson);

  const matchups = z.array(ZSleeperMatchup).parse(matchupsJson);
  const rosters = z.array(ZSleeperRoster).parse(rostersJson);
  const users = z.array(ZSleeperUserMap).parse(usersJson);

  const league: LeagueMeta = {
    platform: "sleeper",
    leagueId: leagueId,
    season: leagueParsed.season,
    name: leagueParsed.name,
  };

  const domain = toDomain(league, week, { matchups, rosters, users });
  return { raw: { matchups, rosters, users }, domain };
}

// Backwards-compatible export for existing imports
export const getLeagueWeekData = getLeagueWeek;

export function toDomain(
  league: LeagueMeta,
  week: number,
  raw: {
    matchups: z.infer<typeof ZSleeperMatchup>[];
    rosters: z.infer<typeof ZSleeperRoster>[];
    users: z.infer<typeof ZSleeperUserMap>[];
  }
): MatchupWeek {
  const teamMap = new Map<number, Team>();
  const userMap = new Map<string, z.infer<typeof ZSleeperUserMap>>();
  raw.users.forEach((u) => userMap.set(u.user_id, u));
  raw.rosters.forEach((r) => {
    const user = userMap.get(r.owner_id);
    const displayName = user?.display_name || user?.username || `Team ${r.roster_id}`;
    const team: Team = {
      teamId: String(r.roster_id),
      displayName,
      ownerUserId: r.owner_id,
    };
    teamMap.set(r.roster_id, team);
  });

  // Group matchups by matchup_id
  const grouped: Record<number, z.infer<typeof ZSleeperMatchup>[]> = {};
  raw.matchups.forEach((m: z.infer<typeof ZSleeperMatchup>) => {
    if (!grouped[m.matchup_id]) grouped[m.matchup_id] = [];
    grouped[m.matchup_id].push(m);
  });

  const matchups: Matchup[] = Object.values(grouped).map((pair) => {
    const [a, b] = pair;
    const home = a;
    const away = b;
    const homeTeamId = String(home.roster_id);
    const awayTeamId = String(away.roster_id);

    const buildRoster = (m: z.infer<typeof ZSleeperMatchup>): RosterSpot[] => {
      const starters = m.starters.map((p: string) => ({
        slot: "FLEX",
        playerId: p,
        points: m.players_points[p] ?? 0,
      }));
      const benchPlayers = m.players
        .filter((p: string) => !m.starters.includes(p))
        .map((p: string) => ({ slot: "BN", playerId: p, points: m.players_points[p] ?? 0 }));
      return [...starters, ...benchPlayers];
    };

    const homePoints = home.points;
    const awayPoints = away.points;
    let winner: "home" | "away" | "tie" = "tie";
    if (homePoints > awayPoints) winner = "home";
    else if (awayPoints > homePoints) winner = "away";
    const margin = Math.abs(homePoints - awayPoints);
    return {
      id: `${homeTeamId}-${awayTeamId}-${week}`,
      week,
      homeTeamId,
      awayTeamId,
      homePoints,
      awayPoints,
      homeRoster: buildRoster(home),
      awayRoster: buildRoster(away),
      winner,
      margin,
    };
  });

  let topScorerTeamId = "";
  let topScorerPoints = -1;
  matchups.forEach((m) => {
    if (m.homePoints > topScorerPoints) {
      topScorerPoints = m.homePoints;
      topScorerTeamId = m.homeTeamId;
    }
    if (m.awayPoints > topScorerPoints) {
      topScorerPoints = m.awayPoints;
      topScorerTeamId = m.awayTeamId;
    }
  });

  let biggestBlowoutGameId: string | null = null;
  let closestGameId: string | null = null;
  let maxMargin = -1;
  let minMargin = Number.MAX_SAFE_INTEGER;
  matchups.forEach((m) => {
    if (m.margin > maxMargin) {
      maxMargin = m.margin;
      biggestBlowoutGameId = m.id;
    }
    if (m.margin < minMargin) {
      minMargin = m.margin;
      closestGameId = m.id;
    }
  });

  const summary = {
    topScorerTeamId,
    topScorerPoints,
    biggestBlowoutGameId,
    closestGameId,
  };

  const domain: MatchupWeek = {
    platform: "sleeper",
    league,
    generatedAt: new Date().toISOString(),
    week,
    teams: Array.from(teamMap.values()),
    matchups,
    summary,
    weeklyAwards: [
      { key: "top_scorer", label: "Top Scorer", teamId: topScorerTeamId, value: topScorerPoints },
    ],
  };
  ZMatchupWeek.parse(domain); // ensure structure
  return domain;
}
