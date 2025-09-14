import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { getEnv } from '../config/env';
import { oauthExchange, refreshToken } from '../providers/yahoo';

export interface StoredTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number; // seconds from issuance
  created_at: string; // ISO string
}

async function readTokens(path: string): Promise<StoredTokens | null> {
  try {
    const raw = await readFile(path, 'utf8');
    return JSON.parse(raw) as StoredTokens;
  } catch {
    return null;
  }
}

async function writeTokens(path: string, tokens: StoredTokens): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(tokens, null, 2), 'utf8');
}

function isExpired(tokens: StoredTokens): boolean {
  if (!tokens.expires_in) return false;
  const created = new Date(tokens.created_at).getTime();
  const expiry = created + tokens.expires_in * 1000;
  // refresh a bit early (30s) to avoid edge timing issues
  return Date.now() >= expiry - 30_000;
}

export async function buildAuthorizationUrl(state: string): Promise<string> {
  const env = getEnv(true);
  const auth = new URL('https://api.login.yahoo.com/oauth2/request_auth');
  auth.searchParams.set('client_id', env.YAHOO_CLIENT_ID!);
  auth.searchParams.set('redirect_uri', env.YAHOO_REDIRECT_URI!);
  auth.searchParams.set('response_type', 'code');
  auth.searchParams.set('scope', env.YAHOO_SCOPES);
  auth.searchParams.set('language', 'en-us');
  auth.searchParams.set('duration', 'permanent');
  auth.searchParams.set('state', state);
  return auth.toString();
}

export async function exchangeCodeAndPersist(code: string) {
  const env = getEnv(true);
  const res = await oauthExchange(code);
  const tokens: StoredTokens = {
    access_token: res.access_token,
    refresh_token: res.refresh_token,
    expires_in: res.expires_in,
    created_at: new Date().toISOString(),
  };
  await writeTokens(env.YAHOO_TOKEN_STORE, tokens);
  return tokens;
}

export async function getAccessToken(): Promise<string> {
  const env = getEnv(true);
  let tokens = await readTokens(env.YAHOO_TOKEN_STORE);
  if (!tokens) throw new Error('no_tokens');
  if (!isExpired(tokens)) return tokens.access_token;

  if (!tokens.refresh_token) throw new Error('no_refresh_token');
  const refreshed = await refreshToken(tokens.refresh_token);
  tokens = {
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token ?? tokens.refresh_token,
    expires_in: refreshed.expires_in,
    created_at: new Date().toISOString(),
  };
  await writeTokens(env.YAHOO_TOKEN_STORE, tokens);
  return tokens.access_token;
}

