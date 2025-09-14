#!/usr/bin/env tsx
import { getEnv } from '../lib/config/env';
import { buildAuthorizationUrl, getAccessToken } from '../lib/integrations/yahooAuth';
import { getGames } from '../lib/integrations/yahooClient';

async function main() {
  const env = getEnv();
  // If tokens not present, advise user to visit /auth/yahoo/login
  try {
    const token = await getAccessToken();
    if (!token) throw new Error('no_token');
  } catch (e) {
    console.warn('No Yahoo tokens detected. Please visit /auth/yahoo/login in your browser.');
    try {
      const url = await buildAuthorizationUrl('doctor');
      console.log('Authorize at:', url);
    } catch {}
    process.exit(2);
  }

  try {
    const games = await getGames();
    console.log(JSON.stringify({ ok: true, gamesCount: games.length, sample: games[0] ?? null }, null, 2));
    process.exit(0);
  } catch (err: any) {
    console.error('Yahoo doctor failed:', err?.message || err);
    process.exit(1);
  }
}

main();

