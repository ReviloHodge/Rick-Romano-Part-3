import { League, Snapshot } from '../types';

const API = 'https://fantasysports.yahooapis.com/fantasy/v2';
const TOKEN_URL = 'https://api.login.yahoo.com/oauth2/get_token';

export async function oauthExchange(code: string) {
  // TODO: implement real exchange
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.YAHOO_CLIENT_ID || '',
      client_secret: process.env.YAHOO_CLIENT_SECRET || '',
      redirect_uri: process.env.YAHOO_REDIRECT_URI || '',
      code,
      grant_type: 'authorization_code',
    }).toString(),
  });
  if (!res.ok) throw new Error('yahoo oauthExchange failed');
  return res.json();
}

export async function refreshToken(refresh_token: string) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.YAHOO_CLIENT_ID || '',
      client_secret: process.env.YAHOO_CLIENT_SECRET || '',
      redirect_uri: process.env.YAHOO_REDIRECT_URI || '',
      refresh_token,
      grant_type: 'refresh_token',
    }).toString(),
  });
  if (!res.ok) throw new Error('yahoo refresh failed');
  return res.json();
}

export async function listLeagues(accessToken: string): Promise<League[]> {
  // Yahoo uses XML; using JSON format=JSON for convenience
  const res = await fetch(`${API}/users;use_login=1/games;game_keys=nfl/leagues?format=json`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('yahoo listLeagues failed');
  const data = await res.json();
  const leagues = data.fantasy_content.users[0].user[1].games[0].game[1].leagues;
  return leagues.map((l: any) => ({
    league_id: l.league_key,
    name: l.name,
    season: l.season,
  }));
}

export async function getLeagueWeekData(
  accessToken: string,
  leagueId: string,
  week: number
): Promise<Snapshot> {
  // TODO: implement full normalization
  const res = await fetch(`${API}/league/${leagueId}/scoreboard;week=${week}?format=json`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  return {
    week,
    league_name: leagueId,
    teams: [],
    matchups: [],
    transactions: { waivers: [], trades: [], injuries: [] },
  };
}
