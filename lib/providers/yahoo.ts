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
 * Exchange an authorization code for tokens.
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

/**
 * Refresh an access token using a refresh_token.
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
    try { err = await res.json(); } catch { err = await res.text(); }
    console.error("Yahoo refresh failed", res.status, err);
    throw new Error("yahoo_refresh_failed");
  }

  return res.json();
}

export type League = { league_id: string; name: string; season: string };

/**
 * Example: list the current user's NFL leagues.
 */
export async function listLeagues(accessToken: string): Promise<League[]> {
  const res = await fetch(
    'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/leagues?format=json',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error('yahoo_listLeagues_failed');

  const data = await res.json();

  const users = data?.fantasy_content?.users;
  if (!Array.isArray(users)) return [];

  const user = users[0]?.user;
  const games = user?.[1]?.games?.[0]?.game;
  const gameArray = Array.isArray(games) ? games : [games].filter(Boolean);

  const leagues: League[] = [];
  for (const g of gameArray) {
    const leagueArr = g?.[1]?.leagues?.[0]?.league;
    const leagueList = Array.isArray(leagueArr) ? leagueArr : [leagueArr].filter(Boolean);
    for (const l of leagueList) {
      const meta = l?.[0];
      if (meta?.league_key && meta?.name) {
        leagues.push({
          league_id: String(meta.league_key),
          name: String(meta.name),
          season: String(meta.season ?? ''),
        });
      }
    }
  }

  return leagues;
}

/**
 * Example: get scoreboard for a league/week.
 * Returns raw JSON — normalize downstream.
 */
export async function getLeagueWeekData(
  accessToken: string,
  leagueId: string,
  week: number
) {
  const res = await fetch(
    `${FANTASY_API}/league/${leagueId}/scoreboard;week=${week}?format=json`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error("yahoo_getLeagueWeekData_failed");
  return res.json();
}
