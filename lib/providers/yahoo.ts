// lib/providers/yahoo.ts

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
 * Exchange authorization code for tokens (Yahoo requires Basic auth).
 * Throws on failure; callers can catch and handle.
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
    try { err = await res.json(); } catch { err = await res.text(); }
    console.error("Yahoo token exchange failed", res.status, err);
    throw new Error("yahoo_oauth_exchange_failed");
  }

  return res.json();
}

/** Refresh access token (also uses Basic auth). */
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
    try { err = await res.json(); } catch { err = await res.text(); }
    console.error("Yahoo refresh failed", res.status, err);
    throw new Error("yahoo_refresh_failed");
  }

  return res.json();
}

/* ------------------------ Fantasy API helpers ------------------------ */

async function yahooGet(path: string, accessToken: string) {
  const url = `${FANTASY_API}${path}${path.includes("?") ? "&" : "?"}format=json`;
  const res = await fetch(url, { headers: { authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    let err: unknown;
    try { err = await res.json(); } catch { err = await res.text(); }
    console.error("Yahoo API GET failed", res.status, url, err);
    throw new Error("yahoo_api_failed");
  }
  return res.json();
}

type SimpleLeague = { league_id: string; name: string; season: string | number };

/**
 * List the current user’s NFL leagues.
 * Returns a simple array: [{ league_id, name, season }]
 * (Yahoo JSON is very nested; this parser is resilient.)
 */
export async function listLeagues(accessToken: string): Promise<SimpleLeague[]> {
  const data = await yahooGet(`/users;use_login=1/games;game_keys=nfl/leagues`, accessToken);

  try {
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
        const leagueKey = l?.league_key ?? l?.[0]?.league_key;
        const name = l?.name ?? l?.[0]?.name;
        const season = l?.season ?? l?.[0]?.season;
        if (leagueKey && name) {
          leagues.push({ league_id: leagueKey, name, season: season ?? "" });
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
 * Get a league’s scoreboard for a week.
 * Returns a minimal normalized shape with the raw payload attached.
 */
export async function getLeagueWeekData(
  accessToken: string,
  leagueKey: string,
  week: number
) {
  const data = await yahooGet(
    `/league/${encodeURIComponent(leagueKey)}/scoreboard;week=${week}`,
    accessToken
  );

  return {
    week,
    provider: "yahoo" as const,
    league_id: leagueKey,
    league_name: leagueKey, // fetch meta separately if you want pretty names
    raw: data,
  };
}
