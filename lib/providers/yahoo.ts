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

/**
 * Example: list the current user's NFL leagues.
 * NOTE: Yahoo Fantasy API is deeply nested JSON; you may need to adjust parsing.
 */
export async function listLeagues(accessToken: string) {
  const res = await fetch(
    `${FANTASY_API}/users;use_login=1/games;game_keys=nfl/leagues?format=json`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error("yahoo_listLeagues_failed");

  const data = await res.json();
  const users = data?.fantasy_content?.users;
  const userArr = Array.isArray(users) ? users : users?.[0]?.user;
  // Yahoo often returns: fantasy_content.users[0].user[1].games[0].game[1].leagues
  const userNode = Array.isArray(userArr) ? userArr : users?.[0]?.user;
  const gamesNode = userNode?.[1]?.games?.[0]?.game;
  const game = Array.isArray(gamesNode) ? gamesNode : gamesNode?.[0]?.game;

  const leaguesNode = game?.[1]?.leagues;
  if (!leaguesNode) return [];

  const leagues: Array<{ league_id: string; name: string; season: string }> = [];

  Object.keys(leaguesNode).forEach((k) => {
    const entry = leaguesNode[k];
    const league = entry?.league ?? entry;
    const leagueKey = league?.league_key ?? league?.[0]?.league_key;
    const name = league?.name ?? league?.[0]?.name;
    const season = league?.season ?? league?.[0]?.season;
    if (leagueKey && name) {
      leagues.push({
        league_id: String(leagueKey),
        name: String(name),
        season: String(season ?? ''),
      });
    }
  });

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
