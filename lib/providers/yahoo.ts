// lib/providers/yahoo.ts

import { safeFetch, FetchError } from "../http/safeFetch";
import { ZYahooMatchupWeek } from "../schemas";
import { z } from "zod";
import { validateEnv, YAHOO_ENV_VARS } from "../validateEnv";
import type {
  LeagueMeta,
  MatchupWeek,
  Team,
  RosterSpot,
  Matchup,
} from "../../types/domain";
import type {
  Snapshot,
  Team as SnapshotTeam,
  Player as SnapshotPlayer,
  Matchup as SnapshotMatchup,
} from "../types";

validateEnv(YAHOO_ENV_VARS);

const FANTASY_API = "https://fantasysports.yahooapis.com/fantasy/v2";
const TOKEN_URL = "https://api.login.yahoo.com/oauth2/get_token";
const clientId = process.env.YAHOO_CLIENT_ID!;
const clientSecret = process.env.YAHOO_CLIENT_SECRET!;
// Normalize to avoid trailing slash mismatches
const redirectUri = process.env.YAHOO_REDIRECT_URI!.replace(/\/+$/, "");

export interface YahooTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  [key: string]: any;
}

export type League = { leagueId: string; name: string; season: string };

/** Build Yahoo OAuth authorize URL. */
export function buildAuth(state: string) {
  const auth = new URL("https://api.login.yahoo.com/oauth2/request_auth");
  auth.searchParams.set("client_id", clientId);
  auth.searchParams.set("redirect_uri", redirectUri);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", "fspt-r");
  auth.searchParams.set("language", "en-us");
  auth.searchParams.set("duration", "permanent");
  auth.searchParams.set("state", state);
  return auth;
}

/** Exchange an authorization code for tokens. */
export async function oauthExchange(code: string): Promise<YahooTokenResponse> {
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!res.ok) {
    let err: unknown;
    try {
      err = await res.json();
    } catch {
      err = await res.text();
    }

    // Log full error body for debugging
    console.error("Yahoo token exchange failed", res.status, err);

    // Propagate details so callers can surface actionable info
    const detail =
      err == null
        ? ""
        : typeof err === "string"
        ? err
        : JSON.stringify(err);

    throw new Error(
      detail
        ? `yahoo_oauth_exchange_failed: ${detail}`
        : "yahoo_oauth_exchange_failed",
    );
  }

  return res.json();
}

/** Refresh an access token using a refresh_token. */
export async function refreshToken(refresh_token: string): Promise<YahooTokenResponse> {
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token,
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!res.ok) {
    let err: unknown;
    try { err = await res.json(); } catch { err = await res.text(); }
    console.error("Yahoo refresh failed", res.status, err);
    throw new Error("yahoo_refresh_failed");
  }

  return res.json();
}

/**
 * List the current user's NFL leagues and return a flat array.
 * We aggressively guard every nested access Yahoo returns.
 */
export async function listLeagues(accessToken: string): Promise<League[]> {
  let data: any;
  try {
    data = await safeFetch<any>(
      `${FANTASY_API}/users;use_login=1/games;game_keys=nfl/leagues?format=json`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  } catch (err) {
    if (err instanceof FetchError) throw err;
    throw new Error("yahoo_listLeagues_failed");
  }

  // Yahoo structure: fantasy_content -> users[0].user[1].games[0].game[*].[1].leagues[0].league[*].[0]
  const users = data?.fantasy_content?.users;
  if (!Array.isArray(users)) return [];

  const user = users[0]?.user;
  const gamesNode = user?.[1]?.games?.[0]?.game;

  const gameArray: any[] = Array.isArray(gamesNode) ? gamesNode : [gamesNode].filter(Boolean);
  const leagues: League[] = [];

  for (const g of gameArray) {
    const leaguesNode = g?.[1]?.leagues?.[0]?.league;
    const leagueArray: any[] = Array.isArray(leaguesNode) ? leaguesNode : [leaguesNode].filter(Boolean);

    for (const l of leagueArray) {
      const meta = l?.[0];
      const league_key = meta?.league_key;
      const name = meta?.name;
      const season = meta?.season;

      if (league_key && name) {
        leagues.push({
          leagueId: String(league_key),
          name: String(name),
          season: season != null ? String(season) : "",
        });
      }
    }
  }

  return leagues;
}

/** Convert Yahoo scoreboard JSON into a Snapshot for analysis. */
export function toSnapshot(
  league: { leagueId: string; name: string; season: string | number },
  week: number,
  raw: any,
): Snapshot {
  const matchupsNode = raw?.fantasy_content?.league?.[1]?.scoreboard?.matchups || [];
  const matchupArray: any[] = Array.isArray(matchupsNode) ? matchupsNode : [matchupsNode];

  const teamMap = new Map<string, SnapshotTeam>();
  const matchups: SnapshotMatchup[] = [];

  const parseTeam = (teamWrap: any): SnapshotTeam => {
    const t = teamWrap?.team || {};
    const teamId = String(t.team_id || "");
    const teamName = String(t.name || "");
    const managerName =
      t.managers?.[0]?.manager?.nickname || t.managers?.[0]?.manager?.guid || "";
    const pointsForWeek = parseFloat(t.team_points?.total ?? 0);
    const players = t.roster?.players || [];
    const starters: SnapshotPlayer[] = [];
    const bench: SnapshotPlayer[] = [];
    players.forEach((p: any) => {
      const pl = p.player || {};
      const slot = pl.selected_position || pl.selected_position?.[0]?.position || "BN";
      const player: SnapshotPlayer = {
        id: String(pl.player_id || ""),
        name: pl.name?.full || "",
        points: parseFloat(
          pl.total_points ?? pl.points?.total ?? pl.player_points?.total ?? 0,
        ),
      };
      const acq = pl.acquisition_type;
      if (acq) player.acquisitionType = acq;
      if (slot === "BN") bench.push(player);
      else starters.push(player);
    });
    const team: SnapshotTeam = {
      teamId,
      managerName,
      teamName,
      pointsForWeek,
      pointsSeason: pointsForWeek,
      starters,
      bench,
    };
    teamMap.set(teamId, team);
    return team;
  };

  matchupArray.forEach((m: any) => {
    const teams = m?.matchup?.teams || [];
    const [homeWrap, awayWrap] = Array.isArray(teams) ? teams : [teams];
    const homeTeam = parseTeam(homeWrap);
    const awayTeam = parseTeam(awayWrap);
    matchups.push({
      home: homeTeam.teamId,
      away: awayTeam.teamId,
      homeScore: homeTeam.pointsForWeek,
      awayScore: awayTeam.pointsForWeek,
    });
  });

  return {
    week,
    leagueName: league.name,
    teams: Array.from(teamMap.values()),
    matchups,
    transactions: { waivers: [], trades: [], injuries: [] },
  };
}

/** Convert raw Yahoo scoreboard into MatchupWeek domain shape. */
export function toDomain(
  league: LeagueMeta,
  week: number,
  raw: any,
): MatchupWeek {
  const teamMap = new Map<string, Team>();
  const matchups: Matchup[] = [];

  const matchupsNode = raw?.fantasy_content?.league?.[1]?.scoreboard?.matchups || [];
  const matchupArray: any[] = Array.isArray(matchupsNode) ? matchupsNode : [matchupsNode];

  const parseTeam = (teamWrap: any) => {
    const t = teamWrap?.team || {};
    const teamId = String(t.team_id || "");
    const displayName = String(t.name || "");
    const ownerUserId =
      t.managers?.[0]?.manager?.guid || t.managers?.[0]?.manager?.nickname || teamId;
    const points = parseFloat(t.team_points?.total ?? 0);
    const players = t.roster?.players || [];
    const roster: RosterSpot[] = players.map((p: any) => {
      const pl = p.player || {};
      return {
        slot: pl.selected_position || pl.selected_position?.[0]?.position || "BN",
        playerId: String(pl.player_id || ""),
        points: parseFloat(
          pl.total_points ?? pl.points?.total ?? pl.player_points?.total ?? 0,
        ),
      };
    });
    const team: Team = { teamId, displayName, ownerUserId };
    teamMap.set(teamId, team);
    return { team, points, roster };
  };

  matchupArray.forEach((m: any) => {
    const teams = m?.matchup?.teams || [];
    const [homeWrap, awayWrap] = Array.isArray(teams) ? teams : [teams];
    const home = parseTeam(homeWrap);
    const away = parseTeam(awayWrap);
    const winner: "home" | "away" | "tie" =
      home.points > away.points
        ? "home"
        : away.points > home.points
        ? "away"
        : "tie";
    const margin = Math.abs(home.points - away.points);
    matchups.push({
      id: `${home.team.teamId}-${away.team.teamId}-${week}`,
      week,
      homeTeamId: home.team.teamId,
      awayTeamId: away.team.teamId,
      homePoints: home.points,
      awayPoints: away.points,
      homeRoster: home.roster,
      awayRoster: away.roster,
      winner,
      margin,
    });
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
    platform: "yahoo",
    league,
    generatedAt: new Date().toISOString(),
    week,
    teams: Array.from(teamMap.values()),
    matchups,
    summary,
    weeklyAwards: [
      {
        key: "top_scorer",
        label: "Top Scorer",
        teamId: topScorerTeamId,
        value: topScorerPoints,
      },
    ],
  };
  ZYahooMatchupWeek.parse(domain); // ensure structure
  return domain;
}

/** Fetch Yahoo scoreboard and return both raw and domain data */
export async function getLeagueWeek(
  accessToken: string,
  leagueId: string,
  week: number,
) {
  const raw = await safeFetch<any>(
    `${FANTASY_API}/league/${leagueId}/scoreboard;week=${week};players?format=json`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  const leagueMetaNode = raw?.fantasy_content?.league?.[0] || {};
  const league: LeagueMeta = {
    platform: "yahoo",
    leagueId,
    season: z.coerce.number().catch(0).parse(leagueMetaNode?.season ?? 0),
    name: String(leagueMetaNode?.name || ""),
  };

  const domain = toDomain(league, week, raw);
  return { raw, domain };
}

// Backwards-compatible export
export const getLeagueWeekData = getLeagueWeek;

