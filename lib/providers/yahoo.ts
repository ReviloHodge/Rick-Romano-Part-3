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

export type League = { league_id: string; name: string; season: string };

/** Exchange an authorization code for tokens. */
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

/** Refresh an access token using a refresh_token. */
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
 * List the current user's NFL leagues and return a flat array.
 * We aggressively guard every nested access Yahoo returns.
 */
export async function listLeagues(accessToken: string): Promise<League[]> {
  const res = await fetch(
    `${FANTASY_API}/users;use_login=1/games;game_keys=nfl/leagues?format=json`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error("yahoo_listLeagues_failed");

  const data = await res.json();

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
          league_id: String(league_key),
          name: String(name),
          season: season != null ? String(season) : "",
        });
      }
    }
  }

  return leagues;
}

/** Example raw scoreboard fetch; keep as-is for now. */
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

