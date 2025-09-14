import { safeFetch } from '../http/safeFetch';
import { getAccessToken } from './yahooAuth';

const FANTASY_API = 'https://fantasysports.yahooapis.com/fantasy/v2';
const TIMEOUT_MS = 10_000;

export interface YahooGameMeta {
  game_key: string;
  code: string;
  name: string;
  season: string;
}

export async function getGames(): Promise<YahooGameMeta[]> {
  const token = await getAccessToken();
  const data = await safeFetch<any>(`${FANTASY_API}/games;game_codes=nfl?format=json`, {
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs: TIMEOUT_MS,
  });
  const gamesNode = data?.fantasy_content?.games?.[0]?.game;
  const arr: any[] = Array.isArray(gamesNode) ? gamesNode : [gamesNode].filter(Boolean);
  return arr.map((g) => ({
    game_key: String(g?.game_key || ''),
    code: String(g?.code || ''),
    name: String(g?.name || ''),
    season: String(g?.season || ''),
  }));
}

