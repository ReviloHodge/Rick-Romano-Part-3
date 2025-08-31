// lib/providers/yahoo.ts

// Yahoo Fantasy Sports + OAuth helpers (MVP, resilient parsing)

const FANTASY_API = "https://fantasysports.yahooapis.com/fantasy/v2";
const TOKEN_URL = "https://api.login.yahoo.com/oauth2/get_token";

export interface YahooTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  [key: string]: any;
}

/**
 * Exchange authorization code for tokens.
 * Uses Basic auth per Yahoo spec.
 */
export async function oauthExchange(code: string): Promise<YahooTokenResponse> {
  const clientId = process.env.YAHOO_CLIENT_ID;
  const clientSecret = process.env.YAHOO_CLIENT_SECRET;
  const redirectUri = process.env.YAHOO_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Yahoo OAuth env vars");
  }

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
    console.error("Yahoo token exchange failed", res.status, err);
    throw new Error("yahoo_oauth_exchange_failed");
  }

  return res.json();
}

/**
 * Refresh access token.
 */
export async function refreshToken(refresh_token: string): Promise<YahooTokenResponse> {
  const clientId = process.env.YAHOO_CLIENT_ID;
  const clientSecret = process.env.YAHOO_CLIENT_SECRET;
  const redirectUri = process.env.YAHOO_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Yahoo OAuth env vars");
  }

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
    try {
      err = await res.json();
    } catch {
      err = await res.text();
    }
    console.error("Yahoo refresh failed", res.status, err);
    throw new Error("yahoo_refresh_failed");
  }

  return res.json();
}

// ---- Fantasy API helpers ----

async function yahooGet(path: string, accessToken: string) {
  const url = `${FANTASY_API}${path}${path.includes("?") ? "&" : "?"}format=json`;
  const res = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    let err: unknown;
    try {
      err = await res.json();
    } catch {
      err = await res.text();
    }
    console.error("Yahoo API GET failed", res.status, url, err);
    throw new Error("yahoo_api_failed");
  }
  return res.json();
}

type SimpleLeague = { league_id: string; name: string; season: string | number };

/**
 * List the current user’s NFL leagues.
 * Yahoo JSON is deeply nested; this pulls out a simple [{league_id, name, season}] array.
 */
export async function listLeagues(accessToken: string): Promise<SimpleLeague[]> {
  // Current user leagues for NFL game
  const data = await yahooGet(`/users;use_login=1/games;game_keys=nfl/leagues`, accessToken);

  // Resilient extraction (the JSON structure can vary)
  try {
    // Path: fantasy_content.users[0].user[1].games[0].game is an array of { game, ... }
    const users = data?.fantasy_content?.users;
    if (!Array.isArray(users) || !users[0]?.user) return [];
    const gamesWrapper = users[0].user[1]?.games?.[0]?.game;
    if (!Array.isArray(gamesWrapper)) return [];

    const leagues: SimpleLeague[] = [];

    for (const g of gamesWrapper) {
      const leaguesNode = g?.[1]?.leagues;
      const leagueArray = leaguesNode?.[0]?.league;
      if (!Array.isArray(leagueArray)) continue;

      for (const l of leagueArray) {
        const leagueKey = l?.league_key;
        const name = l?.name ?? l?.[0]?.name;
        const season = l?.season ?? l?.[0]?.season;
        if (leagueKey && name) {
          leagues.push({
            league_id: leagueKey,
            name,
            season: season ?? "",
          });
        }
      }
    }

    return leagues;
  } catch (e) {
    console.error("Failed to parse Yahoo leagues JSON", e);
    return [];
  }
}

/**
 * Get week scoreboard for a league. Returns a light, normalized snapshot
 * with raw payloads included for downstream processing.
 */
export async function getLeagueWeekData(
  accessToken: string,
  leagueKey: string,
  week: number
) {
  // Scoreboard for a specific week
  const data = await yahooGet(`/league/${encodeURIComponent(leagueKey)}/scoreboard;week=${week}`, accessToken);

  // Minimal normalized shape for your analysis pipeline
  return {
    week,
    provider: "yahoo" as const,
    league_id: leagueKey,
    league_name: leagueKey, // You can fetch meta for pretty name if desired
    raw: data,
  };
}
